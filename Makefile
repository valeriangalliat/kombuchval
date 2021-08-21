batch:
	@./scripts/batch

ferment:
	@./scripts/ferment

bottle:
	@./scripts/bottle

chill:
	@./scripts/chill

brix:
	@./scripts/brix

sup:
	@./scripts/sup

price:
	@./scripts/price

update-readme:
	@./scripts/update-readme > README.md.new
	@mv README.md.new README.md
