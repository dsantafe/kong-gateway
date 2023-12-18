class ClacksPlugin {
    async access(kong) {
        await kong.response.setHeader(`X-Clacks-Overhead`, "GNU Terry Pratchett");
    }
}

module.exports = {
    Plugin: ClacksPlugin,
    Version: "0.1.0"
};
