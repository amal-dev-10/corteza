package routes

import (
	"github.com/cortezaproject/corteza/server/custom/handlers"
	"github.com/go-chi/chi/v5"
)

func MountHttpRoutes(r chi.Router) {
	r.Route("/new/api", func(newApi chi.Router) {
		newApi.Route("/auth", func(authRoutes chi.Router) {
			loginHandler := handlers.NewLoginHandler()
			authRoutes.Post("/get-auth-client", loginHandler.GetAuthCLient)
		})
	})
}
