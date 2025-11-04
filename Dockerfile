FROM mongo:7.0

# Create data directory
RUN mkdir -p /data/db

# Expose MongoDB port
EXPOSE 27017

# Set default command
CMD ["mongod"]
