package graph

import (
	"errors"
	"log"

	"github.com/bfosses/sharemytrips/internal/domain/auth"
	"github.com/bfosses/sharemytrips/internal/domain/media"
	"github.com/bfosses/sharemytrips/internal/domain/stage"
	"github.com/bfosses/sharemytrips/internal/domain/travelleg"
	"github.com/bfosses/sharemytrips/internal/domain/trip"
	"github.com/bfosses/sharemytrips/internal/domain/visit"
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
	case errors.Is(err, trip.ErrStartDateRequired):
		return []*UserError{{Field: strPtr("startDate"), Message: trip.ErrStartDateRequired.Error()}}
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
	case errors.Is(err, trip.ErrNoVisitsToClose):
		return []*UserError{{Message: trip.ErrNoVisitsToClose.Error()}}
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
	// visit errors
	case errors.Is(err, visit.ErrDateRequired):
		return []*UserError{{Field: strPtr("date"), Message: visit.ErrDateRequired.Error()}}
	case errors.Is(err, visit.ErrGPSRequired):
		return []*UserError{{Field: strPtr("lat"), Message: visit.ErrGPSRequired.Error()}}
	case errors.Is(err, visit.ErrNotFound):
		return []*UserError{{Message: visit.ErrNotFound.Error()}}
	case errors.Is(err, visit.ErrTripClosed):
		return []*UserError{{Message: visit.ErrTripClosed.Error()}}
	case errors.Is(err, visit.ErrMustBelongToStage):
		return []*UserError{{Message: visit.ErrMustBelongToStage.Error()}}
	case errors.Is(err, visit.ErrAlreadyAttached):
		return []*UserError{{Message: visit.ErrAlreadyAttached.Error()}}
	case errors.Is(err, visit.ErrNotAttached):
		return []*UserError{{Message: visit.ErrNotAttached.Error()}}
	case errors.Is(err, visit.ErrStageNotInTrip):
		return []*UserError{{Field: strPtr("stageID"), Message: visit.ErrStageNotInTrip.Error()}}
	case errors.Is(err, visit.ErrReorderIDMismatch):
		return []*UserError{{Field: strPtr("visitIDs"), Message: visit.ErrReorderIDMismatch.Error()}}
	// travel-leg errors
	case errors.Is(err, travelleg.ErrNotFound):
		return []*UserError{{Message: travelleg.ErrNotFound.Error()}}
	case errors.Is(err, travelleg.ErrTripClosed):
		return []*UserError{{Message: travelleg.ErrTripClosed.Error()}}
	case errors.Is(err, travelleg.ErrInvalidTransport):
		return []*UserError{{Field: strPtr("transport"), Message: travelleg.ErrInvalidTransport.Error()}}
	case errors.Is(err, travelleg.ErrInvalidDistance):
		return []*UserError{{Field: strPtr("distanceKm"), Message: travelleg.ErrInvalidDistance.Error()}}
	case errors.Is(err, travelleg.ErrStageNotInTrip):
		return []*UserError{{Field: strPtr("fromStageID"), Message: travelleg.ErrStageNotInTrip.Error()}}
	case errors.Is(err, travelleg.ErrStagesNotConsecutive):
		return []*UserError{{Field: strPtr("toStageID"), Message: travelleg.ErrStagesNotConsecutive.Error()}}
	case errors.Is(err, travelleg.ErrPairAlreadyExists):
		return []*UserError{{Message: travelleg.ErrPairAlreadyExists.Error()}}
	case errors.Is(err, travelleg.ErrIncompleteResolutionPlan):
		return []*UserError{{Field: strPtr("resolutionPlan"), Message: "resolve every affected journey by moving or deleting it before changing the itinerary"}}
	case errors.Is(err, travelleg.ErrDuplicateResolution),
		errors.Is(err, travelleg.ErrResolutionForValidLeg),
		errors.Is(err, travelleg.ErrInvalidResolution),
		errors.Is(err, travelleg.ErrResolutionTargetNotConsecutive),
		errors.Is(err, travelleg.ErrDuplicateResolutionTarget),
		errors.Is(err, travelleg.ErrResolutionTargetOccupied):
		return []*UserError{{Field: strPtr("resolutionPlan"), Message: err.Error()}}
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
	case errors.Is(err, auth.ErrInvalidRole):
		return []*UserError{{Field: strPtr("role"), Message: auth.ErrInvalidRole.Error()}}
	case errors.Is(err, auth.ErrInvalidResetToken):
		return []*UserError{{Field: strPtr("token"), Message: auth.ErrInvalidResetToken.Error()}}
	case errors.Is(err, auth.ErrResetTokenExpired):
		return []*UserError{{Field: strPtr("token"), Message: auth.ErrResetTokenExpired.Error()}}
	case errors.Is(err, auth.ErrInvalidCurrentPassword):
		return []*UserError{{Field: strPtr("currentPassword"), Message: auth.ErrInvalidCurrentPassword.Error()}}
	case errors.Is(err, auth.ErrPasswordTooLong):
		return []*UserError{{Field: strPtr("password"), Message: auth.ErrPasswordTooLong.Error()}}
	// media errors
	case errors.Is(err, media.ErrNotFound):
		return []*UserError{{Message: media.ErrNotFound.Error()}}
	case errors.Is(err, media.ErrFilenameRequired):
		return []*UserError{{Field: strPtr("filename"), Message: media.ErrFilenameRequired.Error()}}
	case errors.Is(err, media.ErrInvalidContentType):
		return []*UserError{{Field: strPtr("contentType"), Message: media.ErrInvalidContentType.Error()}}
	case errors.Is(err, media.ErrTripClosed):
		return []*UserError{{Message: media.ErrTripClosed.Error()}}
	case errors.Is(err, media.ErrVisitNotFound):
		return []*UserError{{Field: strPtr("visitID"), Message: media.ErrVisitNotFound.Error()}}
	case errors.Is(err, media.ErrTravelLegNotFound):
		return []*UserError{{Field: strPtr("travelLegID"), Message: media.ErrTravelLegNotFound.Error()}}
	case errors.Is(err, media.ErrIDMismatch):
		return []*UserError{{Field: strPtr("mediaIDs"), Message: media.ErrIDMismatch.Error()}}
	case errors.Is(err, media.ErrOwnerRequired):
		return []*UserError{{Field: strPtr("input"), Message: media.ErrOwnerRequired.Error()}}
	case errors.Is(err, media.ErrMediaRequired):
		return []*UserError{{Field: strPtr("mediaIDs"), Message: media.ErrMediaRequired.Error()}}
	case errors.Is(err, media.ErrMixedOwners):
		return []*UserError{{Field: strPtr("mediaIDs"), Message: media.ErrMixedOwners.Error()}}
	case errors.Is(err, media.ErrSameOwner):
		return []*UserError{{Message: media.ErrSameOwner.Error()}}
	case errors.Is(err, media.ErrTripMismatch):
		return []*UserError{{Field: strPtr("input"), Message: media.ErrTripMismatch.Error()}}
	default:
		log.Printf("unhandled domain error: %v", err)
		return []*UserError{{Message: "internal error"}}
	}
}

func strPtr(s string) *string { return &s }
