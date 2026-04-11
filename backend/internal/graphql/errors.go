package graph

import (
	"errors"
	"log"

	"github.com/bfosses/sharemytrips/internal/domain/auth"
	"github.com/bfosses/sharemytrips/internal/domain/day"
	"github.com/bfosses/sharemytrips/internal/domain/stage"
	"github.com/bfosses/sharemytrips/internal/domain/trip"
)

// domainErrorToUserErrors maps domain errors to GraphQL UserError payloads.
// Unknown/internal errors are logged and returned as a generic message.
func domainErrorToUserErrors(err error) []*UserError {
	switch {
	case errors.Is(err, trip.ErrTitleRequired):
		return []*UserError{{Field: strPtr("title"), Message: trip.ErrTitleRequired.Error()}}
	case errors.Is(err, trip.ErrCountryRequired):
		return []*UserError{{Field: strPtr("country"), Message: trip.ErrCountryRequired.Error()}}
	case errors.Is(err, trip.ErrGPSRequired):
		return []*UserError{{Field: strPtr("lat"), Message: trip.ErrGPSRequired.Error()}}
	case errors.Is(err, trip.ErrInvalidDates):
		return []*UserError{{Field: strPtr("endDate"), Message: trip.ErrInvalidDates.Error()}}
	case errors.Is(err, trip.ErrNotFound):
		return []*UserError{{Message: trip.ErrNotFound.Error()}}
	case errors.Is(err, trip.ErrAlreadyPublished):
		return []*UserError{{Message: trip.ErrAlreadyPublished.Error()}}
	case errors.Is(err, trip.ErrAlreadyClosed):
		return []*UserError{{Message: trip.ErrAlreadyClosed.Error()}}
	case errors.Is(err, trip.ErrNotPublished):
		return []*UserError{{Message: trip.ErrNotPublished.Error()}}
	case errors.Is(err, trip.ErrClosed):
		return []*UserError{{Message: trip.ErrClosed.Error()}}
	case errors.Is(err, trip.ErrNoDaysToClose):
		return []*UserError{{Message: trip.ErrNoDaysToClose.Error()}}
	case errors.Is(err, trip.ErrCannotCloseDraft):
		return []*UserError{{Message: trip.ErrCannotCloseDraft.Error()}}
	case errors.Is(err, trip.ErrNotClosed):
		return []*UserError{{Message: trip.ErrNotClosed.Error()}}
	// stage errors
	case errors.Is(err, stage.ErrCityRequired):
		return []*UserError{{Field: strPtr("city"), Message: stage.ErrCityRequired.Error()}}
	case errors.Is(err, stage.ErrGPSRequired):
		return []*UserError{{Field: strPtr("lat"), Message: stage.ErrGPSRequired.Error()}}
	case errors.Is(err, stage.ErrNotFound):
		return []*UserError{{Message: stage.ErrNotFound.Error()}}
	case errors.Is(err, stage.ErrTripClosed):
		return []*UserError{{Message: stage.ErrTripClosed.Error()}}
	// day errors
	case errors.Is(err, day.ErrDateRequired):
		return []*UserError{{Field: strPtr("date"), Message: day.ErrDateRequired.Error()}}
	case errors.Is(err, day.ErrGPSRequired):
		return []*UserError{{Field: strPtr("lat"), Message: day.ErrGPSRequired.Error()}}
	case errors.Is(err, day.ErrNotFound):
		return []*UserError{{Message: day.ErrNotFound.Error()}}
	case errors.Is(err, day.ErrTripClosed):
		return []*UserError{{Message: day.ErrTripClosed.Error()}}
	case errors.Is(err, day.ErrMustBelongToStage):
		return []*UserError{{Message: day.ErrMustBelongToStage.Error()}}
	case errors.Is(err, day.ErrAlreadyAttached):
		return []*UserError{{Message: day.ErrAlreadyAttached.Error()}}
	case errors.Is(err, day.ErrNotAttached):
		return []*UserError{{Message: day.ErrNotAttached.Error()}}
	case errors.Is(err, day.ErrStageNotInTrip):
		return []*UserError{{Field: strPtr("stageID"), Message: day.ErrStageNotInTrip.Error()}}
	// auth errors
	case errors.Is(err, auth.ErrNameRequired):
		return []*UserError{{Field: strPtr("name"), Message: auth.ErrNameRequired.Error()}}
	case errors.Is(err, auth.ErrEmailRequired):
		return []*UserError{{Field: strPtr("email"), Message: auth.ErrEmailRequired.Error()}}
	case errors.Is(err, auth.ErrPasswordRequired):
		return []*UserError{{Field: strPtr("password"), Message: auth.ErrPasswordRequired.Error()}}
	case errors.Is(err, auth.ErrPasswordMismatch):
		return []*UserError{{Field: strPtr("passwordConfirm"), Message: auth.ErrPasswordMismatch.Error()}}
	case errors.Is(err, auth.ErrEmailTaken):
		return []*UserError{{Field: strPtr("email"), Message: auth.ErrEmailTaken.Error()}}
	case errors.Is(err, auth.ErrNotFound):
		return []*UserError{{Message: auth.ErrNotFound.Error()}}
	case errors.Is(err, auth.ErrInvalidCredentials):
		return []*UserError{{Message: auth.ErrInvalidCredentials.Error()}}
	case errors.Is(err, auth.ErrSetupAlreadyDone):
		return []*UserError{{Message: auth.ErrSetupAlreadyDone.Error()}}
	case errors.Is(err, auth.ErrCannotDeleteSelf):
		return []*UserError{{Message: auth.ErrCannotDeleteSelf.Error()}}
	case errors.Is(err, auth.ErrForbidden):
		return []*UserError{{Message: auth.ErrForbidden.Error()}}
	case errors.Is(err, auth.ErrInvalidResetToken):
		return []*UserError{{Field: strPtr("token"), Message: auth.ErrInvalidResetToken.Error()}}
	case errors.Is(err, auth.ErrResetTokenExpired):
		return []*UserError{{Field: strPtr("token"), Message: auth.ErrResetTokenExpired.Error()}}
	case errors.Is(err, auth.ErrInvalidCurrentPassword):
		return []*UserError{{Field: strPtr("currentPassword"), Message: auth.ErrInvalidCurrentPassword.Error()}}
	case errors.Is(err, auth.ErrPasswordTooLong):
		return []*UserError{{Field: strPtr("password"), Message: auth.ErrPasswordTooLong.Error()}}
	default:
		log.Printf("unhandled domain error: %v", err)
		return []*UserError{{Message: "internal error"}}
	}
}

func strPtr(s string) *string { return &s }
