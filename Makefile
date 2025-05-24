.PHONY: dev test lint fresh audit copy-locales clean-and-build-lib build-server-release install-client-and-build-webapp docker-build automax-local-build

dev:
	@echo "---Processing libs---"
	@(cd $(CURDIR)/lib && make dev) || (echo "Failed to build libs"; exit 1)
	@echo "---Processing clients---"
	@(cd $(CURDIR)/client && make dev) || (echo "Failed to yarn clients"; exit 1)

test:
	@echo "---Testing libs---"
	@(cd $(CURDIR)/lib && make test) || (echo "Failed to test libs"; exit 1)
	@echo "---Testing clients---"
	@(cd $(CURDIR)/client && make test) || (echo "Failed to test clients"; exit 1)
	@echo "---Testing server---"
	@(cd $(CURDIR)/server && make test) || (echo "Failed to test server"; exit 1)

lint:
	@echo "---Linting libs---"
	@(cd $(CURDIR)/lib && make lint) || (echo "Failed to lint libs"; exit 1)
	@echo "---Linting clients---"
	@(cd $(CURDIR)/client && make lint) || (echo "Failed to lint clients"; exit 1)

fresh:
	@echo "---Fresh---"
	@(cd $(CURDIR)/lib && make fresh) || (echo "Failed to fresh libs"; exit 1)
	@echo "---Fresh clients---"
	@(cd $(CURDIR)/client && make fresh) || (echo "Failed to fresh clients"; exit 1)


audit:
	@echo "---Audit---"
	@(cd $(CURDIR)/lib && make audit) || true
	@echo "---Audit clients---"
	@(cd $(CURDIR)/client && make audit) || true

# new
copy-locales:
	cp -r locale/en server/pkg/locale/src/

clean-and-build-lib:
	$(MAKE) -C lib build

build-server-release:
	rm -rf server/build
	$(MAKE) -C server release

install-client-and-build-webapp:
	cd client && yarn install && $(MAKE) yarn
	cd server/webapp && NODE_OPTIONS=--openssl-legacy-provider $(MAKE) install-fresh
	cd server/webapp && $(MAKE) tar

docker-build:
	sudo docker build --no-cache -t corteza:local .

automax-local-build: copy-locales clean-and-build-lib build-server-release install-client-and-build-webapp docker-build

.DEFAULT_GOAL := dev