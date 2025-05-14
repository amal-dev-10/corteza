package handlers

import (
	"net/http"

	"github.com/cortezaproject/corteza/server/custom/dtos"
	"github.com/cortezaproject/corteza/server/custom/utils/helpers"
	"github.com/cortezaproject/corteza/server/system/service"
	"github.com/cortezaproject/corteza/server/system/types"
)

type (
	Login interface {
		GetAuthCLient(w http.ResponseWriter, r *http.Request)
	}

	login struct {
	}
)

func NewLoginHandler() Login {
	return login{}
}

func (h login) GetAuthCLient(w http.ResponseWriter, r *http.Request) {
	var loginDTO dtos.LoginDTO
	err := loginDTO.BindRequestBody(r)

	if err != nil {
		helpers.HttpFailedResponse(&w, http.StatusBadRequest, "Invalid request body", map[string]interface{}{"error": err.Error()})
		return
	}

	if loginDTO.Email == "" || loginDTO.Password == "" {
		helpers.HttpFailedResponse(&w, http.StatusBadRequest, "Password and email cannote be empty", nil)
		return
	}

	user, err := service.DefaultAuth.InternalLogin(r.Context(), loginDTO.Email, loginDTO.Password)

	if err != nil {
		helpers.HttpFailedResponse(&w, http.StatusBadRequest, "Unable to find the user", map[string]interface{}{"error": err.Error()})
		return
	}

	authClientSet, _, err := service.DefaultAuthClient.Search(r.Context(), types.AuthClientFilter{})
	if err != nil {
		helpers.HttpFailedResponse(&w, http.StatusBadRequest, "Unable to find the auth credentials", map[string]interface{}{"error": err.Error()})
		return
	}

	if len(authClientSet) == 0 {
		helpers.HttpFailedResponse(&w, http.StatusBadRequest, "No auth client credentials are created", nil)
		return
	}

	for _, authClient := range authClientSet {
		if authClient.Security.ImpersonateUser == user.ID {
			helpers.HttpSuccessResponse(&w, http.StatusAccepted, "Verified User", map[string]interface{}{
				"authClient": authClient,
			})
			return
		}
	}

	helpers.HttpSuccessResponse(&w, http.StatusNoContent, "User didn't have auth credentials", nil)
}
