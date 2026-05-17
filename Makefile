# Gym App - Docker Commands

.PHONY: help build up down restart logs clean dev prod

# Default target
help: ## Show this help message
	@echo "Gym App - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development commands
dev: ## Start development environment
	@echo "🚀 Starting Gym App in development mode..."
	docker-compose up -d postgres
	@echo "⏳ Waiting for database to be ready..."
	sleep 10
	docker-compose up -d backend
	@echo "✅ Backend is running at http://localhost:3000"
	@echo "📚 API Docs at http://localhost:3000/api-docs"
	@echo "🗄️  PgAdmin at http://localhost:5050 (admin@gymapp.com / admin123)"

frontend: ## Start frontend only
	@echo "📱 Starting frontend..."
	docker-compose up frontend

# Production commands
prod: ## Start production environment
	@echo "🚀 Starting Gym App in production mode..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Build commands
build: ## Build all containers
	@echo "🔨 Building all containers..."
	docker-compose build

build-backend: ## Build backend container
	@echo "🔨 Building backend container..."
	docker-compose build backend

build-frontend: ## Build frontend container
	@echo "🔨 Building frontend container..."
	docker-compose build frontend

# Control commands
up: ## Start all services
	@echo "🚀 Starting all services..."
	docker-compose up -d

down: ## Stop all services
	@echo "🛑 Stopping all services..."
	docker-compose down

restart: ## Restart all services
	@echo "🔄 Restarting all services..."
	docker-compose restart

# Logs commands
logs: ## Show logs for all services
	docker-compose logs -f

logs-backend: ## Show backend logs
	docker-compose logs -f backend

logs-frontend: ## Show frontend logs
	docker-compose logs -f frontend

logs-db: ## Show database logs
	docker-compose logs -f postgres

# Database commands
db-reset: ## Reset database
	@echo "🗄️  Resetting database..."
	docker-compose down -v
	docker-compose up -d postgres
	@echo "⏳ Waiting for database to be ready..."
	sleep 10
	docker-compose up -d backend

db-backup: ## Backup database
	@echo "💾 Creating database backup..."
	docker-compose exec postgres pg_dump -U postgres gym_app_db > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup created: backup_$(shell date +%Y%m%d_%H%M%S).sql"

# Cleanup commands
clean: ## Clean up containers and volumes
	@echo "🧹 Cleaning up..."
	docker-compose down -v
	docker system prune -f

clean-all: ## Clean up everything including images
	@echo "🧹 Cleaning up everything..."
	docker-compose down -v --rmi all
	docker system prune -af

# Status commands
status: ## Show status of all services
	@echo "📊 Service Status:"
	docker-compose ps

# Test commands
test: ## Run tests
	@echo "🧪 Running tests..."
	docker-compose exec backend npm test

# Quick start
start: dev ## Quick start (alias for dev)
