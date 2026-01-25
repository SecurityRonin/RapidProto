.PHONY: help setup dev test test-watch test-ui test-coverage db-push db-studio clean build deploy ci

# Default target
help:
	@echo "50-Minute MVP Template - Available Commands:"
	@echo ""
	@echo "  make setup          - Run interactive setup wizard"
	@echo "  make dev            - Start development server"
	@echo "  make test           - Run all tests"
	@echo "  make test-watch     - Run tests in watch mode"
	@echo "  make test-ui        - Open Vitest UI"
	@echo "  make test-coverage  - Generate coverage report"
	@echo "  make db-push        - Push database schema"
	@echo "  make db-studio      - Open Drizzle Studio"
	@echo "  make clean          - Clean build artifacts"
	@echo "  make build          - Build for production"
	@echo "  make deploy         - Deploy to Vercel"
	@echo "  make ci             - Run all CI checks"
	@echo ""

# Setup wizard
setup:
	@npm run setup

# Development
dev:
	@npm run dev

# Testing
test:
	@npm test

test-watch:
	@npm run test:watch

test-ui:
	@npm run test:ui

test-coverage:
	@npm run test:coverage

# Database
db-push:
	@npm run db:push

db-studio:
	@npm run db:studio

# Build
build:
	@npm run build

# Clean
clean:
	@rm -rf .next
	@rm -rf node_modules
	@rm -rf coverage
	@echo "Cleaned build artifacts"

# Deploy
deploy:
	@vercel --prod

# CI - Run all checks
ci:
	@npm run ci
