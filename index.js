const Discord = require("discord-user-bots");
const INTERVAL_MS = 1812000; // 30.2 minutes in milliseconds

class DiscordBot {
    constructor() {
        this.token = process.env.DISCORD_TOKEN;
        this.channelId = "911252893250781255";
        this.client = null;
        this.isRunning = false;
        
        if (!this.token) {
            console.error("ERROR: DISCORD_TOKEN environment variable is not set");
            process.exit(1);
        }
    }

    async initialize() {
        console.log("Initializing Discord bot...");
        this.client = new Discord.Client();
        
        // Set up event handlers
        this.client.on("ready", () => {
            console.log("Discord client is ready!");
            this.isRunning = true;
        });
        
        this.client.on("error", (error) => {
            console.error("Discord client error:", error.message);
            this.isRunning = false;
        });
        
        try {
            console.log("Logging in to Discord...");
            await this.client.login(this.token);
        } catch (error) {
            console.error("Failed to login:", error.message);
            throw error;
        }
        
        // Wait for client to be ready
        await new Promise((resolve) => {
            const checkReady = () => {
                if (this.isRunning) {
                    resolve();
                } else {
                    setTimeout(checkReady, 100);
                }
            };
            checkReady();
        });
    }

    async sendMessage() {
        if (!this.isRunning) {
            await this.initialize();
        }
        
        try {
            console.log("Sending message...");
            await this.client.send(this.channelId, {
                content: "!!work"
            });
            console.log("Message sent successfully!");
            return true;
        } catch (error) {
            console.error("Error sending message:", error.message);
            // Try to reinitialize if there's an error
            this.isRunning = false;
            return false;
        }
    }

    async destroy() {
        if (this.client) {
            this.client.destroy();
            console.log("Discord client destroyed");
        }
        this.isRunning = false;
    }
}

// Main execution function
async function main() {
    const bot = new DiscordBot();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log("Shutting down...");
        await bot.destroy();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log("Received termination signal...");
        await bot.destroy();
        process.exit(0);
    });
    
    let executionCount = 0;
    
    while (true) {
        try {
            executionCount++;
            console.log(`\n=== Execution #${executionCount} ===`);
            console.log(new Date().toISOString());
            
            const success = await bot.sendMessage();
            
            if (success) {
                console.log(`Message sent. Waiting ${INTERVAL_MS / 60000} minutes until next execution...`);
            } else {
                console.log("Message failed. Waiting 1 minute before retry...");
                await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute on error
                continue;
            }
            
            // Wait for the specified interval
            await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));
            
        } catch (error) {
            console.error("Unexpected error in main loop:", error.message);
            console.log("Waiting 5 minutes before retry...");
            await new Promise(resolve => setTimeout(resolve, 300000)); // Wait 5 minutes on critical error
        }
    }
}

// Start the bot
main().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
});
