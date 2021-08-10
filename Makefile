batch:
	./scripts/batch

ferment:
	./scripts/ferment

bottle:
	./scripts/bottle

chill:
	./scripts/chill

update-readme:
	./scripts/update-readme > README.md.new
	mv README.md.new README.md
