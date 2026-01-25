.PHONY: help install dev test test-watch db-push db-studio clean deploy

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm install

dev: ## Start development server
	npm run dev

test: ## Run all tests
	npm test

test-watch: ## Run tests in watch mode
	npm test -- --watch

test-coverage: ## Run tests with coverage report
	npm test -- --coverage

db-push: ## Push database schema to Turso
	npm run db:push

db-studio: ## Open Drizzle Studio (database GUI)
	npm run db:studio

clean: ## Clean build artifacts and dependencies
	rm -rf .next node_modules .turbo

deploy: ## Deploy to Vercel production
	vercel --prod

demo: ## Run demo setup (customize for client)
	@echo "🎯 Template #16: Client Intake & Onboarding"
	@echo ""
	@echo "Quick customization checklist:"
	@echo "1. Update firm name in components/intake-form.tsx"
	@echo "2. Customize email templates in lib/email.ts"
	@echo "3. Add custom fields to schema if needed"
	@echo "4. Update DEMO_SCRIPT.md with client-specific examples"
	@echo "5. Deploy: make deploy"
	@echo ""
	@echo "Demo URL will be: https://your-project.vercel.app/intake"

# Development workflow
setup: install db-push ## Full setup (install + database)
	@echo "✅ Setup complete! Run 'make dev' to start"

# CI workflow
ci: test ## Run CI checks
	@echo "✅ All checks passed"

# Pre-demo checklist
pre-demo: test ## Pre-demo checklist
	@echo "📋 Pre-Demo Checklist:"
	@echo "✅ Tests passing"
	@echo "[ ] Environment variables set in Vercel"
	@echo "[ ] Custom domain configured"
	@echo "[ ] Demo data seeded"
	@echo "[ ] Firm branding applied"
	@echo "[ ] DEMO_SCRIPT.md reviewed"
