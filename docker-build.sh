#!/bin/bash

# Docker Build and Deploy Script for HRA Application
set -e

# Configuration
IMAGE_NAME="hra-app"
TAG="latest"
REGISTRY="your-registry.azurecr.io"
CONTAINER_NAME="hra-container"

echo "🐳 Building Docker image for HRA application..."

# Build the Docker image
echo "📦 Building image: $IMAGE_NAME:$TAG"
docker build -t $IMAGE_NAME:$TAG .

# Optional: Tag for registry
if [ "$1" = "registry" ]; then
    echo "🏷️  Tagging for registry: $REGISTRY/$IMAGE_NAME:$TAG"
    docker tag $IMAGE_NAME:$TAG $REGISTRY/$IMAGE_NAME:$TAG
fi

# Optional: Run locally
if [ "$1" = "run" ]; then
    echo "🚀 Stopping existing container if running..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
    
    echo "🌐 Starting container: $CONTAINER_NAME"
    docker run -d \
        --name $CONTAINER_NAME \
        -p 8080:8080 \
        --env-file .env \
        --restart unless-stopped \
        $IMAGE_NAME:$TAG
    
    echo "✅ Container started successfully!"
    echo "🌍 Application available at: http://localhost:8080"
    echo "📊 Container status:"
    docker ps | grep $CONTAINER_NAME
fi

# Optional: Push to registry
if [ "$1" = "push" ]; then
    echo "📤 Pushing to registry: $REGISTRY/$IMAGE_NAME:$TAG"
    docker push $REGISTRY/$IMAGE_NAME:$TAG
fi

echo "✅ Docker build completed successfully!"
echo ""
echo "📋 Available commands:"
echo "  ./docker-build.sh         - Build image only"
echo "  ./docker-build.sh run     - Build and run locally"
echo "  ./docker-build.sh registry - Build and tag for registry"
echo "  ./docker-build.sh push    - Build, tag, and push to registry"