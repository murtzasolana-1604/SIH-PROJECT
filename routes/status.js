function statusRoute(req, res) {

    res.json({
        project: "SIH Project",
        status: "working",
        server: "Node.js + Express",
        message: "Backend connected successfully 🚀"
    });

}

module.exports = statusRoute;