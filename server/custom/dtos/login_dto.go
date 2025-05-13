package dtos

import (
	"encoding/json"
	"net/http"
)

type LoginDTO struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (dto *LoginDTO) BindRequestBody(r *http.Request) error {
	err := json.NewDecoder(r.Body).Decode(dto)
	if err != nil {
		return err
	}

	return nil
}
