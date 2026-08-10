FROM node:20

WORKDIR /app

# Expose Expo ports
EXPOSE 8081

# Command to run the development server
# Note: npm install is assumed to be run via volume mount or inside container manually, 
# but we can do a startup script or just let npm run dev install if we want.
# A common pattern for local dev is to install on startup or rely on host node_modules.
# For simplicity, we just run the dev server.
CMD ["npm", "run", "dev"]
