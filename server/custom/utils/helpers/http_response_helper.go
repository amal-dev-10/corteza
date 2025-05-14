package helpers

import (
	"encoding/json"
	"net/http"
)

func HttpSuccessResponse(w *http.ResponseWriter, statusCode int, message string, result map[string]interface{}) {
	(*w).Header().Set("Content-Type", "application/json")
	(*w).WriteHeader(http.StatusOK)

	data := map[string]interface{}{
		"status":  "success",
		"message": message,
	}

	if result != nil {
		data["result"] = result
	}

	json.NewEncoder(*w).Encode(data)
}

func HttpFailedResponse(w *http.ResponseWriter, statusCode int, message string, result map[string]interface{}) {
	(*w).Header().Set("Content-Type", "application/json")
	(*w).WriteHeader(http.StatusOK)

	data := map[string]interface{}{
		"status":  "failed",
		"message": message,
	}

	if result != nil {
		data["result"] = result
	}

	json.NewEncoder(*w).Encode(data)
}
