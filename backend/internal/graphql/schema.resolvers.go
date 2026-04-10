package graph

// THIS CODE WILL BE UPDATED WITH SCHEMA CHANGES. PREVIOUS IMPLEMENTATION FOR SCHEMA CHANGES WILL BE KEPT IN THE COMMENT SECTION. IMPLEMENTATION FOR UNCHANGED SCHEMA WILL BE KEPT.

import (
	"context"
	"errors"
	"time"

	"github.com/bfosses/sharemytrips/internal/domain/auth"
	"github.com/bfosses/sharemytrips/internal/domain/day"
	"github.com/bfosses/sharemytrips/internal/domain/stage"
	"github.com/bfosses/sharemytrips/internal/domain/trip"
)

// CreateTrip is the resolver for the createTrip field.
func (r *mutationResolver) CreateTrip(ctx context.Context, input CreateTripInput) (*TripPayload, error) {
	startDate, startErr := parseOptionalDate(input.StartDate)
	if startErr != nil {
		return &TripPayload{Errors: []*UserError{{Field: strPtr("startDate"), Message: "invalid date format, expected YYYY-MM-DD"}}}, nil
	}
	endDate, endErr := parseOptionalDate(input.EndDate)
	if endErr != nil {
		return &TripPayload{Errors: []*UserError{{Field: strPtr("endDate"), Message: "invalid date format, expected YYYY-MM-DD"}}}, nil
	}

	t, err := r.tripHandler.Create(ctx, trip.CreateTripCommand{
		Title:       input.Title,
		Country:     input.Country,
		Description: derefString(input.Description),
		CoverPhoto:  derefString(input.CoverPhoto),
		Lat:         derefFloat64(input.Lat),
		Lng:         derefFloat64(input.Lng),
		StartDate:   startDate,
		EndDate:     endDate,
	})
	if err != nil {
		return &TripPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &TripPayload{Trip: toGraphQLTrip(t), Errors: []*UserError{}}, nil
}

// UpdateTrip is the resolver for the updateTrip field.
func (r *mutationResolver) UpdateTrip(ctx context.Context, id string, input UpdateTripInput) (*TripPayload, error) {
	startDate, startErr := parseOptionalDate(input.StartDate)
	if startErr != nil {
		return &TripPayload{Errors: []*UserError{{Field: strPtr("startDate"), Message: "invalid date format, expected YYYY-MM-DD"}}}, nil
	}
	endDate, endErr := parseOptionalDate(input.EndDate)
	if endErr != nil {
		return &TripPayload{Errors: []*UserError{{Field: strPtr("endDate"), Message: "invalid date format, expected YYYY-MM-DD"}}}, nil
	}

	t, err := r.tripHandler.Update(ctx, trip.UpdateTripCommand{
		ID:          id,
		Title:       input.Title,
		Country:     input.Country,
		Description: derefString(input.Description),
		CoverPhoto:  derefString(input.CoverPhoto),
		Lat:         derefFloat64(input.Lat),
		Lng:         derefFloat64(input.Lng),
		StartDate:   startDate,
		EndDate:     endDate,
	})
	if err != nil {
		return &TripPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &TripPayload{Trip: toGraphQLTrip(t), Errors: []*UserError{}}, nil
}

// PublishTrip is the resolver for the publishTrip field.
func (r *mutationResolver) PublishTrip(ctx context.Context, id string) (*TripPayload, error) {
	t, err := r.tripHandler.Publish(ctx, trip.PublishTripCommand{ID: id})
	if err != nil {
		return &TripPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &TripPayload{Trip: toGraphQLTrip(t), Errors: []*UserError{}}, nil
}

// UnpublishTrip is the resolver for the unpublishTrip field.
func (r *mutationResolver) UnpublishTrip(ctx context.Context, id string) (*TripPayload, error) {
	t, err := r.tripHandler.Unpublish(ctx, trip.UnpublishTripCommand{ID: id})
	if err != nil {
		return &TripPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &TripPayload{Trip: toGraphQLTrip(t), Errors: []*UserError{}}, nil
}

// CloseTrip is the resolver for the closeTrip field.
func (r *mutationResolver) CloseTrip(ctx context.Context, id string, input CloseTripInput) (*TripPayload, error) {
	firstDay, err := time.Parse(time.DateOnly, input.FirstDay)
	if err != nil {
		return &TripPayload{Errors: []*UserError{{Field: strPtr("firstDay"), Message: "invalid date format, expected YYYY-MM-DD"}}}, nil
	}
	lastDay, err := time.Parse(time.DateOnly, input.LastDay)
	if err != nil {
		return &TripPayload{Errors: []*UserError{{Field: strPtr("lastDay"), Message: "invalid date format, expected YYYY-MM-DD"}}}, nil
	}

	t, err := r.tripHandler.Close(ctx, trip.CloseTripCommand{ID: id, FirstDay: firstDay, LastDay: lastDay})
	if err != nil {
		return &TripPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &TripPayload{Trip: toGraphQLTrip(t), Errors: []*UserError{}}, nil
}

// ReopenTrip is the resolver for the reopenTrip field.
func (r *mutationResolver) ReopenTrip(ctx context.Context, id string) (*TripPayload, error) {
	t, err := r.tripHandler.Reopen(ctx, trip.ReopenTripCommand{ID: id})
	if err != nil {
		return &TripPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &TripPayload{Trip: toGraphQLTrip(t), Errors: []*UserError{}}, nil
}

// DeleteTrip is the resolver for the deleteTrip field.
func (r *mutationResolver) DeleteTrip(ctx context.Context, id string) (*DeleteTripPayload, error) {
	err := r.tripHandler.Delete(ctx, trip.DeleteTripCommand{ID: id})
	if err != nil {
		return &DeleteTripPayload{Success: false, Errors: domainErrorToUserErrors(err)}, nil
	}
	return &DeleteTripPayload{Success: true, Errors: []*UserError{}}, nil
}

// AddStage is the resolver for the addStage field.
func (r *mutationResolver) AddStage(ctx context.Context, input AddStageInput) (*StagePayload, error) {
	s, err := r.stageHandler.Add(ctx, stage.AddStageCommand{
		TripID:      input.TripID,
		City:        input.City,
		Name:        derefString(input.Name),
		Lat:         input.Lat,
		Lng:         input.Lng,
		Description: derefString(input.Description),
	})
	if err != nil {
		return &StagePayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &StagePayload{Stage: toGraphQLStage(s), Errors: []*UserError{}}, nil
}

// UpdateStage is the resolver for the updateStage field.
func (r *mutationResolver) UpdateStage(ctx context.Context, id string, input UpdateStageInput) (*StagePayload, error) {
	s, err := r.stageHandler.Update(ctx, stage.UpdateStageCommand{
		ID:          id,
		City:        input.City,
		Name:        derefString(input.Name),
		Lat:         input.Lat,
		Lng:         input.Lng,
		Description: derefString(input.Description),
	})
	if err != nil {
		return &StagePayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &StagePayload{Stage: toGraphQLStage(s), Errors: []*UserError{}}, nil
}

// DeleteStage is the resolver for the deleteStage field.
func (r *mutationResolver) DeleteStage(ctx context.Context, id string) (*DeleteStagePayload, error) {
	if err := r.stageHandler.Delete(ctx, stage.DeleteStageCommand{ID: id}); err != nil {
		return &DeleteStagePayload{Success: false, Errors: domainErrorToUserErrors(err)}, nil
	}
	return &DeleteStagePayload{Success: true, Errors: []*UserError{}}, nil
}

// AddDay is the resolver for the addDay field.
func (r *mutationResolver) AddDay(ctx context.Context, input AddDayInput) (*DayPayload, error) {
	date, err := time.Parse(dateFormat, input.Date)
	if err != nil {
		return &DayPayload{Errors: []*UserError{{Field: strPtr("date"), Message: "invalid date format, expected YYYY-MM-DD"}}}, nil
	}
	d, err := r.dayHandler.Add(ctx, day.AddDayCommand{
		TripID:      input.TripID,
		StageID:     input.StageID,
		Date:        date,
		Title:       derefString(input.Title),
		Description: derefString(input.Description),
	})
	if err != nil {
		return &DayPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &DayPayload{Day: toGraphQLDay(d), Errors: []*UserError{}}, nil
}

// UpdateDay is the resolver for the updateDay field.
func (r *mutationResolver) UpdateDay(ctx context.Context, id string, input UpdateDayInput) (*DayPayload, error) {
	d, err := r.dayHandler.Update(ctx, day.UpdateDayCommand{
		ID:          id,
		Title:       derefString(input.Title),
		Description: derefString(input.Description),
	})
	if err != nil {
		return &DayPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &DayPayload{Day: toGraphQLDay(d), Errors: []*UserError{}}, nil
}

// DeleteDay is the resolver for the deleteDay field.
func (r *mutationResolver) DeleteDay(ctx context.Context, id string) (*DeleteDayPayload, error) {
	if err := r.dayHandler.Delete(ctx, day.DeleteDayCommand{ID: id}); err != nil {
		return &DeleteDayPayload{Success: false, Errors: domainErrorToUserErrors(err)}, nil
	}
	return &DeleteDayPayload{Success: true, Errors: []*UserError{}}, nil
}

// AttachDayToStage is the resolver for the attachDayToStage field.
func (r *mutationResolver) AttachDayToStage(ctx context.Context, dayID string, stageID string) (*DayPayload, error) {
	d, err := r.dayHandler.AttachToStage(ctx, day.AttachToStageCommand{DayID: dayID, StageID: stageID})
	if err != nil {
		return &DayPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &DayPayload{Day: toGraphQLDay(d), Errors: []*UserError{}}, nil
}

// DetachDayFromStage is the resolver for the detachDayFromStage field.
func (r *mutationResolver) DetachDayFromStage(ctx context.Context, dayID string, stageID string) (*DayPayload, error) {
	d, err := r.dayHandler.DetachFromStage(ctx, day.DetachFromStageCommand{DayID: dayID, StageID: stageID})
	if err != nil {
		return &DayPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &DayPayload{Day: toGraphQLDay(d), Errors: []*UserError{}}, nil
}

// SetupAdmin is the resolver for the setupAdmin field.
func (r *mutationResolver) SetupAdmin(ctx context.Context, input SetupAdminInput) (*AuthPayload, error) {
	result, err := r.authHandler.SetupAdmin(ctx, auth.SetupAdminCommand{
		Name:            input.Name,
		Email:           input.Email,
		Password:        input.Password,
		PasswordConfirm: input.PasswordConfirm,
	})
	if err != nil {
		return &AuthPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &AuthPayload{Token: &result.Token, Account: toGraphQLAccount(result.User), Errors: []*UserError{}}, nil
}

// Login is the resolver for the login field.
func (r *mutationResolver) Login(ctx context.Context, email string, password string) (*AuthPayload, error) {
	result, err := r.authHandler.Login(ctx, auth.LoginCommand{Email: email, Password: password})
	if err != nil {
		return &AuthPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &AuthPayload{Token: &result.Token, Account: toGraphQLAccount(result.User), Errors: []*UserError{}}, nil
}

// Logout is the resolver for the logout field.
func (r *mutationResolver) Logout(ctx context.Context) (bool, error) {
	token := sessionTokenFromContext(ctx)
	_ = r.authHandler.Logout(ctx, auth.LogoutCommand{Token: token})
	return true, nil
}

// CreateAccount is the resolver for the createAccount field.
func (r *mutationResolver) CreateAccount(ctx context.Context, input CreateAccountInput) (*AccountPayload, error) {
	actorID := r.currentUserID(ctx)
	user, err := r.authHandler.CreateAccount(ctx, auth.CreateAccountCommand{
		ActorID:         actorID,
		Name:            input.Name,
		Email:           input.Email,
		Password:        input.Password,
		PasswordConfirm: input.PasswordConfirm,
	})
	if err != nil {
		return &AccountPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &AccountPayload{Account: toGraphQLAccount(user), Errors: []*UserError{}}, nil
}

// DeleteAccount is the resolver for the deleteAccount field.
func (r *mutationResolver) DeleteAccount(ctx context.Context, id string) (*DeleteAccountPayload, error) {
	actorID := r.currentUserID(ctx)
	if err := r.authHandler.DeleteAccount(ctx, auth.DeleteAccountCommand{ActorID: actorID, TargetID: id}); err != nil {
		return &DeleteAccountPayload{Success: false, Errors: domainErrorToUserErrors(err)}, nil
	}
	return &DeleteAccountPayload{Success: true, Errors: []*UserError{}}, nil
}

// RequestPasswordReset is the resolver for the requestPasswordReset field.
func (r *mutationResolver) RequestPasswordReset(ctx context.Context, email string) (bool, error) {
	_ = r.authHandler.RequestPasswordReset(ctx, auth.RequestPasswordResetCommand{Email: email})
	return true, nil
}

// ResetPassword is the resolver for the resetPassword field.
func (r *mutationResolver) ResetPassword(ctx context.Context, input ResetPasswordInput) (*AccountPayload, error) {
	user, err := r.authHandler.ResetPassword(ctx, auth.ResetPasswordCommand{
		Token:              input.Token,
		NewPassword:        input.NewPassword,
		NewPasswordConfirm: input.NewPasswordConfirm,
	})
	if err != nil {
		return &AccountPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &AccountPayload{Account: toGraphQLAccount(user), Errors: []*UserError{}}, nil
}

// ChangePassword is the resolver for the changePassword field.
func (r *mutationResolver) ChangePassword(ctx context.Context, input ChangePasswordInput) (*AccountPayload, error) {
	userID := r.currentUserID(ctx)
	user, err := r.authHandler.ChangePassword(ctx, auth.ChangePasswordCommand{
		UserID:             userID,
		CurrentPassword:    input.CurrentPassword,
		NewPassword:        input.NewPassword,
		NewPasswordConfirm: input.NewPasswordConfirm,
	})
	if err != nil {
		return &AccountPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &AccountPayload{Account: toGraphQLAccount(user), Errors: []*UserError{}}, nil
}

// Trips is the resolver for the trips field.
func (r *queryResolver) Trips(ctx context.Context, status []TripStatus) ([]*Trip, error) {
	statuses := make([]trip.Status, 0, len(status))
	for _, s := range status {
		statuses = append(statuses, todomainStatus(s))
	}

	trips, err := r.tripHandler.List(ctx, trip.ListTripsQuery{StatusIn: statuses})
	if err != nil {
		return nil, err
	}

	result := make([]*Trip, 0, len(trips))
	for _, t := range trips {
		result = append(result, toGraphQLTrip(t))
	}
	return result, nil
}

// Trip is the resolver for the trip field.
func (r *queryResolver) Trip(ctx context.Context, id string) (*Trip, error) {
	t, err := r.tripHandler.GetByID(ctx, trip.GetTripQuery{ID: id})
	if err != nil {
		if errors.Is(err, trip.ErrNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return toGraphQLTrip(t), nil
}

// Stage is the resolver for the stage field.
func (r *queryResolver) Stage(ctx context.Context, id string) (*Stage, error) {
	s, err := r.stageHandler.GetByID(ctx, stage.GetStageQuery{ID: id})
	if err != nil {
		if errors.Is(err, stage.ErrNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return toGraphQLStage(s), nil
}

// Stages is the resolver for the stages field.
func (r *queryResolver) Stages(ctx context.Context, tripID string) ([]*Stage, error) {
	stages, err := r.stageHandler.ListByTrip(ctx, stage.ListByTripQuery{TripID: tripID})
	if err != nil {
		return nil, err
	}
	result := make([]*Stage, 0, len(stages))
	for _, s := range stages {
		result = append(result, toGraphQLStage(s))
	}
	return result, nil
}

// Day is the resolver for the day field.
func (r *queryResolver) Day(ctx context.Context, id string) (*Day, error) {
	d, err := r.dayHandler.GetByID(ctx, day.GetDayQuery{ID: id})
	if err != nil {
		if errors.Is(err, day.ErrNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return toGraphQLDay(d), nil
}

// Days is the resolver for the days field.
func (r *queryResolver) Days(ctx context.Context, stageID string) ([]*Day, error) {
	days, err := r.dayHandler.ListByStage(ctx, day.ListByStageQuery{StageID: stageID})
	if err != nil {
		return nil, err
	}
	result := make([]*Day, 0, len(days))
	for _, d := range days {
		result = append(result, toGraphQLDay(d))
	}
	return result, nil
}

// Me is the resolver for the me field.
func (r *queryResolver) Me(ctx context.Context) (*Account, error) {
	token := sessionTokenFromContext(ctx)
	if token == "" {
		return nil, nil
	}
	user, err := r.authHandler.GetCurrentUser(ctx, auth.GetCurrentUserQuery{Token: token})
	if err != nil {
		return nil, nil
	}
	return toGraphQLAccount(user), nil
}

// SetupStatus is the resolver for the setupStatus field.
func (r *queryResolver) SetupStatus(ctx context.Context) (*SetupStatusPayload, error) {
	done, err := r.authHandler.IsSetupDone(ctx, auth.IsSetupDoneQuery{})
	if err != nil {
		return nil, err
	}
	return &SetupStatusPayload{Done: done}, nil
}

// Accounts is the resolver for the accounts field.
func (r *queryResolver) Accounts(ctx context.Context) ([]*Account, error) {
	actorID := r.currentUserID(ctx)
	users, err := r.authHandler.ListAccounts(ctx, auth.ListAccountsQuery{ActorID: actorID})
	if err != nil {
		return nil, err
	}
	result := make([]*Account, 0, len(users))
	for _, u := range users {
		result = append(result, toGraphQLAccount(u))
	}
	return result, nil
}

// Mutation returns MutationResolver implementation.
func (r *Resolver) Mutation() MutationResolver { return &mutationResolver{r} }

// Query returns QueryResolver implementation.
func (r *Resolver) Query() QueryResolver { return &queryResolver{r} }

type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
