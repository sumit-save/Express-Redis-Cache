const axios = require("axios");
const express = require("express");
const ioredis = require("ioredis");
const bodyparser = require("body-parser");
const PORT = 8000;

const app = express();
const redis = new ioredis.Redis();

// Middleware
app.use(bodyparser.json());

// Constant
const externalurl = "https://jsonplaceholder.typicode.com";
const expiry = 60;

// Route
app.get("/post-details/:postid", async (req, res) => {
    try {
        const postid = req.params.postid;
        if (!postid) {
            return res.status(400).json({ message: "please enter postid" });
        } else {
            const cacheavaliable = await redis.get(`post:${postid}`);
            if (cacheavaliable) {
                return res.status(200).json({
                    message: "data fetched successfully",
                    source: "cache",
                    data: JSON.parse(cacheavaliable)
                });
            } else {
                const { status, data } = await axios.get(`${externalurl}/posts/${postid}`);
                if (status === 200) {
                    const setcache = await redis.setex(`post:${postid}`, expiry, JSON.stringify(data));
                    return res.status(200).json({
                        message: "data fetched successfully",
                        source: "api",
                        data: data
                    });
                } else {
                    return res.status(400).json({ message: "external api unable to reach" });
                }
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "internal server error" });
    }
});

// Create Server On Localhost:8000
(async () => {
    try {
        app.listen(PORT);
        console.log(`Server Started On Localhost:${PORT}`);
    } catch (error) {
        console.log(`Unable To Create Server On Localhost:${PORT}`);
        console.log(error);
    }
})();