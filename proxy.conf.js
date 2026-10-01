const PROXY_CONFIG = {
  "/liveboard": {
    target: "https://traintracker-1.onrender.com",
    secure: false,
    changeOrigin: true,
    bypass: function (req) {
      if (req.headers.accept && req.headers.accept.indexOf("html") !== -1) {
        return "/index.html";
      }
    }
  },
  "/stations": {
    target: "https://traintracker-1.onrender.com",
    secure: false,
    changeOrigin: true,
    bypass: function (req) {
      if (req.headers.accept && req.headers.accept.indexOf("html") !== -1) {
        return "/index.html";
      }
    }
  },
  "/connections": {
    target: "https://traintracker-1.onrender.com",
    secure: false,
    changeOrigin: true,
    bypass: function (req) {
      if (req.headers.accept && req.headers.accept.indexOf("html") !== -1) {
        return "/index.html";
      }
    }
  },
  "/liveboardHub": {
    target: "https://traintracker-1.onrender.com",
    secure: false,
    changeOrigin: true,
    ws: true
  }
};

module.exports = PROXY_CONFIG;
