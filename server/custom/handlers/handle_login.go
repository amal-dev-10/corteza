package handlers

import (
	"net/http"

	"github.com/cortezaproject/corteza/server/custom/dtos"
	"github.com/cortezaproject/corteza/server/custom/utils/helpers"
	"github.com/cortezaproject/corteza/server/system/service"
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

	authCli, err := service.DefaultAuthClient.LookupUserByID(r.Context(), user.ID)
	if err != nil {
		helpers.HttpFailedResponse(&w, http.StatusBadRequest, "Unable to find the auth credentials", map[string]interface{}{"error": err.Error()})
		return
	}

	if authCli != nil {
		helpers.HttpSuccessResponse(&w, http.StatusNoContent, "Auth client fetched successfully!", map[string]interface{}{
			"auth-client": authCli,
		})
		return
	}

	helpers.HttpSuccessResponse(&w, http.StatusNoContent, "User didn't have auth credentials", nil)
}
