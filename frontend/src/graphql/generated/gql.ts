/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  mutation CreateAccount($input: CreateAccountInput!) {\n    createAccount(input: $input) {\n      account {\n        id\n        name\n        email\n        role\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.CreateAccountDocument,
    "\n  mutation DeleteAccount($id: ID!) {\n    deleteAccount(id: $id) {\n      success\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.DeleteAccountDocument,
    "\n  mutation ChangePassword($input: ChangePasswordInput!) {\n    changePassword(input: $input) {\n      account {\n        id\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.ChangePasswordDocument,
    "\n  query Accounts {\n    accounts {\n      id\n      name\n      email\n      role\n      createdAt\n    }\n  }\n": typeof types.AccountsDocument,
    "\n  mutation RequestPasswordReset($email: String!) {\n    requestPasswordReset(email: $email)\n  }\n": typeof types.RequestPasswordResetDocument,
    "\n  mutation Login($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      token\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.LoginDocument,
    "\n  mutation ResetPassword($input: ResetPasswordInput!) {\n    resetPassword(input: $input) {\n      account {\n        id\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.ResetPasswordDocument,
    "\n  mutation SetupAdmin($input: SetupAdminInput!) {\n    setupAdmin(input: $input) {\n      token\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.SetupAdminDocument,
    "\n  mutation Logout {\n    logout\n  }\n": typeof types.LogoutDocument,
    "\n  query Me {\n    me {\n      id\n      name\n      email\n      role\n    }\n  }\n": typeof types.MeDocument,
    "\n  query SetupStatus {\n    setupStatus {\n      done\n    }\n  }\n": typeof types.SetupStatusDocument,
    "\n  mutation UpdateMediaCaption($id: ID!, $caption: String) {\n    updateMediaCaption(id: $id, caption: $caption) {\n      media {\n        id\n        caption\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.UpdateMediaCaptionDocument,
    "\n  mutation ReorderMedia($visitID: ID!, $mediaIDs: [ID!]!) {\n    reorderMedia(visitID: $visitID, mediaIDs: $mediaIDs) {\n      media {\n        id\n        position\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.ReorderMediaDocument,
    "\n  mutation DeleteMedia($id: ID!) {\n    deleteMedia(id: $id) {\n      success\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.DeleteMediaDocument,
    "\n  mutation ReorderTravelLegMedia($travelLegID: ID!, $mediaIDs: [ID!]!) {\n    reorderTravelLegMedia(travelLegID: $travelLegID, mediaIDs: $mediaIDs) {\n      media {\n        id\n        position\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.ReorderTravelLegMediaDocument,
    "\n  query VisitMedia($visitID: ID!) {\n    visitMedia(visitID: $visitID) {\n      id\n      visitID\n      tripID\n      filename\n      contentType\n      caption\n      url\n      thumbUrl\n      position\n      createdAt\n    }\n  }\n": typeof types.VisitMediaDocument,
    "\n  query TravelLegMedia($travelLegID: ID!) {\n    travelLegMedia(travelLegID: $travelLegID) {\n      id\n      visitID\n      travelLegID\n      tripID\n      filename\n      contentType\n      caption\n      url\n      thumbUrl\n      position\n      createdAt\n    }\n  }\n": typeof types.TravelLegMediaDocument,
    "\n  query TripMedia($tripID: ID!) {\n    tripMedia(tripID: $tripID) {\n      id\n      visitID\n      tripID\n      contentType\n      thumbUrl\n    }\n  }\n": typeof types.TripMediaDocument,
    "\n  mutation AddStage($input: AddStageInput!) {\n    addStage(input: $input) {\n      stage {\n        id\n        tripID\n        city\n        displayName\n        lat\n        lng\n        description\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.AddStageDocument,
    "\n  mutation UpdateStage($id: ID!, $input: UpdateStageInput!) {\n    updateStage(id: $id, input: $input) {\n      stage {\n        id\n        tripID\n        city\n        displayName\n        lat\n        lng\n        description\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.UpdateStageDocument,
    "\n  mutation DeleteStage($id: ID!) {\n    deleteStage(id: $id) {\n      success\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.DeleteStageDocument,
    "\n  query Stages($tripID: ID!) {\n    stages(tripID: $tripID) {\n      id\n      tripID\n      city\n      displayName\n      lat\n      lng\n      description\n    }\n  }\n": typeof types.StagesDocument,
    "\n  query TripVisits($tripID: ID!) {\n    tripVisits(tripID: $tripID) {\n      id\n      tripID\n      stageIDs\n      date\n      title\n      description\n      lat\n      lng\n      position\n    }\n  }\n": typeof types.TripVisitsDocument,
    "\n  mutation AddVisit($input: AddVisitInput!) {\n    addVisit(input: $input) {\n      visit {\n        id\n        tripID\n        stageIDs\n        date\n        title\n        description\n        lat\n        lng\n        position\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.AddVisitDocument,
    "\n  mutation UpdateVisit($id: ID!, $input: UpdateVisitInput!) {\n    updateVisit(id: $id, input: $input) {\n      visit {\n        id\n        tripID\n        stageIDs\n        date\n        title\n        description\n        lat\n        lng\n        position\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.UpdateVisitDocument,
    "\n  mutation DeleteVisit($id: ID!) {\n    deleteVisit(id: $id) {\n      success\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.DeleteVisitDocument,
    "\n  mutation ReorderVisits($stageID: ID!, $date: String!, $visitIDs: [ID!]!) {\n    reorderVisits(stageID: $stageID, date: $date, visitIDs: $visitIDs) {\n      visits {\n        id\n        position\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.ReorderVisitsDocument,
    "\n  query Visits($stageID: ID!) {\n    visits(stageID: $stageID) {\n      id\n      tripID\n      stageIDs\n      date\n      title\n      description\n      lat\n      lng\n      position\n    }\n  }\n": typeof types.VisitsDocument,
    "\n  mutation CreateTravelLeg($input: CreateTravelLegInput!) {\n    createTravelLeg(input: $input) {\n      travelLeg {\n        id\n        tripID\n        fromStageID\n        toStageID\n        transport\n        description\n        distanceKm\n        createdAt\n        updatedAt\n      }\n      errors { field message }\n    }\n  }\n": typeof types.CreateTravelLegDocument,
    "\n  mutation UpdateTravelLeg($id: ID!, $input: UpdateTravelLegInput!) {\n    updateTravelLeg(id: $id, input: $input) {\n      travelLeg {\n        id\n        tripID\n        fromStageID\n        toStageID\n        transport\n        description\n        distanceKm\n        createdAt\n        updatedAt\n      }\n      errors { field message }\n    }\n  }\n": typeof types.UpdateTravelLegDocument,
    "\n  mutation MoveTravelLeg($id: ID!, $input: MoveTravelLegInput!) {\n    moveTravelLeg(id: $id, input: $input) {\n      travelLeg {\n        id\n        tripID\n        fromStageID\n        toStageID\n        transport\n        description\n        distanceKm\n        createdAt\n        updatedAt\n      }\n      errors { field message }\n    }\n  }\n": typeof types.MoveTravelLegDocument,
    "\n  mutation DeleteTravelLeg($id: ID!) {\n    deleteTravelLeg(id: $id) {\n      success\n      errors { field message }\n    }\n  }\n": typeof types.DeleteTravelLegDocument,
    "\n  mutation CalculateTravelLegDistance($fromStageID: ID!, $toStageID: ID!, $transport: TravelLegTransport!) {\n    calculateTravelLegDistance(fromStageID: $fromStageID, toStageID: $toStageID, transport: $transport) {\n      distanceKm\n      errors { field message }\n    }\n  }\n": typeof types.CalculateTravelLegDistanceDocument,
    "\n  query Trip($id: ID!) {\n    trip(id: $id) {\n      id\n      title\n      country\n      description\n      lat\n      lng\n      startDate\n      endDate\n      status\n      coverPhoto\n    }\n  }\n": typeof types.TripDocument,
    "\n  query TripCloseData($tripID: ID!) {\n    stages(tripID: $tripID) {\n      id\n      tripID\n    }\n    tripVisits(tripID: $tripID) {\n      id\n      tripID\n      date\n      stageIDs\n    }\n  }\n": typeof types.TripCloseDataDocument,
    "\n  query TripDetail($id: ID!) {\n    trip(id: $id) {\n      id\n      title\n      country\n      description\n      lat\n      lng\n      startDate\n      endDate\n      status\n      coverPhoto\n    }\n    stages(tripID: $id) {\n      id\n      tripID\n      city\n      displayName\n      lat\n      lng\n      description\n    }\n    tripVisits(tripID: $id) {\n      id\n      tripID\n      stageIDs\n      date\n      title\n      description\n      lat\n      lng\n      position\n    }\n    travelLegs(tripID: $id) {\n      id\n      tripID\n      fromStageID\n      toStageID\n      transport\n      description\n      distanceKm\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.TripDetailDocument,
    "\n  mutation CreateTrip($input: CreateTripInput!) {\n    createTrip(input: $input) {\n      trip {\n        id\n        title\n        country\n        description\n        lat\n        lng\n        startDate\n        endDate\n        status\n        coverPhoto\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.CreateTripDocument,
    "\n  mutation UpdateTrip($id: ID!, $input: UpdateTripInput!) {\n    updateTrip(id: $id, input: $input) {\n      trip {\n        id\n        title\n        country\n        description\n        lat\n        lng\n        startDate\n        endDate\n        status\n        coverPhoto\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.UpdateTripDocument,
    "\n  mutation DeleteTrip($id: ID!) {\n    deleteTrip(id: $id) {\n      success\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.DeleteTripDocument,
    "\n  mutation PublishTrip($id: ID!) {\n    publishTrip(id: $id) {\n      trip {\n        id\n        status\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.PublishTripDocument,
    "\n  mutation UnpublishTrip($id: ID!) {\n    unpublishTrip(id: $id) {\n      trip {\n        id\n        status\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.UnpublishTripDocument,
    "\n  mutation CloseTrip($id: ID!, $input: CloseTripInput!) {\n    closeTrip(id: $id, input: $input) {\n      trip {\n        id\n        status\n        startDate\n        endDate\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.CloseTripDocument,
    "\n  mutation ReopenTrip($id: ID!) {\n    reopenTrip(id: $id) {\n      trip {\n        id\n        status\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.ReopenTripDocument,
    "\n  query Trips($status: [TripStatus!]) {\n    trips(status: $status) {\n      id\n      title\n      country\n      lat\n      lng\n      startDate\n      endDate\n      status\n      coverPhoto\n    }\n  }\n": typeof types.TripsDocument,
};
const documents: Documents = {
    "\n  mutation CreateAccount($input: CreateAccountInput!) {\n    createAccount(input: $input) {\n      account {\n        id\n        name\n        email\n        role\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.CreateAccountDocument,
    "\n  mutation DeleteAccount($id: ID!) {\n    deleteAccount(id: $id) {\n      success\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.DeleteAccountDocument,
    "\n  mutation ChangePassword($input: ChangePasswordInput!) {\n    changePassword(input: $input) {\n      account {\n        id\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.ChangePasswordDocument,
    "\n  query Accounts {\n    accounts {\n      id\n      name\n      email\n      role\n      createdAt\n    }\n  }\n": types.AccountsDocument,
    "\n  mutation RequestPasswordReset($email: String!) {\n    requestPasswordReset(email: $email)\n  }\n": types.RequestPasswordResetDocument,
    "\n  mutation Login($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      token\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.LoginDocument,
    "\n  mutation ResetPassword($input: ResetPasswordInput!) {\n    resetPassword(input: $input) {\n      account {\n        id\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.ResetPasswordDocument,
    "\n  mutation SetupAdmin($input: SetupAdminInput!) {\n    setupAdmin(input: $input) {\n      token\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.SetupAdminDocument,
    "\n  mutation Logout {\n    logout\n  }\n": types.LogoutDocument,
    "\n  query Me {\n    me {\n      id\n      name\n      email\n      role\n    }\n  }\n": types.MeDocument,
    "\n  query SetupStatus {\n    setupStatus {\n      done\n    }\n  }\n": types.SetupStatusDocument,
    "\n  mutation UpdateMediaCaption($id: ID!, $caption: String) {\n    updateMediaCaption(id: $id, caption: $caption) {\n      media {\n        id\n        caption\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.UpdateMediaCaptionDocument,
    "\n  mutation ReorderMedia($visitID: ID!, $mediaIDs: [ID!]!) {\n    reorderMedia(visitID: $visitID, mediaIDs: $mediaIDs) {\n      media {\n        id\n        position\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.ReorderMediaDocument,
    "\n  mutation DeleteMedia($id: ID!) {\n    deleteMedia(id: $id) {\n      success\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.DeleteMediaDocument,
    "\n  mutation ReorderTravelLegMedia($travelLegID: ID!, $mediaIDs: [ID!]!) {\n    reorderTravelLegMedia(travelLegID: $travelLegID, mediaIDs: $mediaIDs) {\n      media {\n        id\n        position\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.ReorderTravelLegMediaDocument,
    "\n  query VisitMedia($visitID: ID!) {\n    visitMedia(visitID: $visitID) {\n      id\n      visitID\n      tripID\n      filename\n      contentType\n      caption\n      url\n      thumbUrl\n      position\n      createdAt\n    }\n  }\n": types.VisitMediaDocument,
    "\n  query TravelLegMedia($travelLegID: ID!) {\n    travelLegMedia(travelLegID: $travelLegID) {\n      id\n      visitID\n      travelLegID\n      tripID\n      filename\n      contentType\n      caption\n      url\n      thumbUrl\n      position\n      createdAt\n    }\n  }\n": types.TravelLegMediaDocument,
    "\n  query TripMedia($tripID: ID!) {\n    tripMedia(tripID: $tripID) {\n      id\n      visitID\n      tripID\n      contentType\n      thumbUrl\n    }\n  }\n": types.TripMediaDocument,
    "\n  mutation AddStage($input: AddStageInput!) {\n    addStage(input: $input) {\n      stage {\n        id\n        tripID\n        city\n        displayName\n        lat\n        lng\n        description\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.AddStageDocument,
    "\n  mutation UpdateStage($id: ID!, $input: UpdateStageInput!) {\n    updateStage(id: $id, input: $input) {\n      stage {\n        id\n        tripID\n        city\n        displayName\n        lat\n        lng\n        description\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.UpdateStageDocument,
    "\n  mutation DeleteStage($id: ID!) {\n    deleteStage(id: $id) {\n      success\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.DeleteStageDocument,
    "\n  query Stages($tripID: ID!) {\n    stages(tripID: $tripID) {\n      id\n      tripID\n      city\n      displayName\n      lat\n      lng\n      description\n    }\n  }\n": types.StagesDocument,
    "\n  query TripVisits($tripID: ID!) {\n    tripVisits(tripID: $tripID) {\n      id\n      tripID\n      stageIDs\n      date\n      title\n      description\n      lat\n      lng\n      position\n    }\n  }\n": types.TripVisitsDocument,
    "\n  mutation AddVisit($input: AddVisitInput!) {\n    addVisit(input: $input) {\n      visit {\n        id\n        tripID\n        stageIDs\n        date\n        title\n        description\n        lat\n        lng\n        position\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.AddVisitDocument,
    "\n  mutation UpdateVisit($id: ID!, $input: UpdateVisitInput!) {\n    updateVisit(id: $id, input: $input) {\n      visit {\n        id\n        tripID\n        stageIDs\n        date\n        title\n        description\n        lat\n        lng\n        position\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.UpdateVisitDocument,
    "\n  mutation DeleteVisit($id: ID!) {\n    deleteVisit(id: $id) {\n      success\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.DeleteVisitDocument,
    "\n  mutation ReorderVisits($stageID: ID!, $date: String!, $visitIDs: [ID!]!) {\n    reorderVisits(stageID: $stageID, date: $date, visitIDs: $visitIDs) {\n      visits {\n        id\n        position\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.ReorderVisitsDocument,
    "\n  query Visits($stageID: ID!) {\n    visits(stageID: $stageID) {\n      id\n      tripID\n      stageIDs\n      date\n      title\n      description\n      lat\n      lng\n      position\n    }\n  }\n": types.VisitsDocument,
    "\n  mutation CreateTravelLeg($input: CreateTravelLegInput!) {\n    createTravelLeg(input: $input) {\n      travelLeg {\n        id\n        tripID\n        fromStageID\n        toStageID\n        transport\n        description\n        distanceKm\n        createdAt\n        updatedAt\n      }\n      errors { field message }\n    }\n  }\n": types.CreateTravelLegDocument,
    "\n  mutation UpdateTravelLeg($id: ID!, $input: UpdateTravelLegInput!) {\n    updateTravelLeg(id: $id, input: $input) {\n      travelLeg {\n        id\n        tripID\n        fromStageID\n        toStageID\n        transport\n        description\n        distanceKm\n        createdAt\n        updatedAt\n      }\n      errors { field message }\n    }\n  }\n": types.UpdateTravelLegDocument,
    "\n  mutation MoveTravelLeg($id: ID!, $input: MoveTravelLegInput!) {\n    moveTravelLeg(id: $id, input: $input) {\n      travelLeg {\n        id\n        tripID\n        fromStageID\n        toStageID\n        transport\n        description\n        distanceKm\n        createdAt\n        updatedAt\n      }\n      errors { field message }\n    }\n  }\n": types.MoveTravelLegDocument,
    "\n  mutation DeleteTravelLeg($id: ID!) {\n    deleteTravelLeg(id: $id) {\n      success\n      errors { field message }\n    }\n  }\n": types.DeleteTravelLegDocument,
    "\n  mutation CalculateTravelLegDistance($fromStageID: ID!, $toStageID: ID!, $transport: TravelLegTransport!) {\n    calculateTravelLegDistance(fromStageID: $fromStageID, toStageID: $toStageID, transport: $transport) {\n      distanceKm\n      errors { field message }\n    }\n  }\n": types.CalculateTravelLegDistanceDocument,
    "\n  query Trip($id: ID!) {\n    trip(id: $id) {\n      id\n      title\n      country\n      description\n      lat\n      lng\n      startDate\n      endDate\n      status\n      coverPhoto\n    }\n  }\n": types.TripDocument,
    "\n  query TripCloseData($tripID: ID!) {\n    stages(tripID: $tripID) {\n      id\n      tripID\n    }\n    tripVisits(tripID: $tripID) {\n      id\n      tripID\n      date\n      stageIDs\n    }\n  }\n": types.TripCloseDataDocument,
    "\n  query TripDetail($id: ID!) {\n    trip(id: $id) {\n      id\n      title\n      country\n      description\n      lat\n      lng\n      startDate\n      endDate\n      status\n      coverPhoto\n    }\n    stages(tripID: $id) {\n      id\n      tripID\n      city\n      displayName\n      lat\n      lng\n      description\n    }\n    tripVisits(tripID: $id) {\n      id\n      tripID\n      stageIDs\n      date\n      title\n      description\n      lat\n      lng\n      position\n    }\n    travelLegs(tripID: $id) {\n      id\n      tripID\n      fromStageID\n      toStageID\n      transport\n      description\n      distanceKm\n      createdAt\n      updatedAt\n    }\n  }\n": types.TripDetailDocument,
    "\n  mutation CreateTrip($input: CreateTripInput!) {\n    createTrip(input: $input) {\n      trip {\n        id\n        title\n        country\n        description\n        lat\n        lng\n        startDate\n        endDate\n        status\n        coverPhoto\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.CreateTripDocument,
    "\n  mutation UpdateTrip($id: ID!, $input: UpdateTripInput!) {\n    updateTrip(id: $id, input: $input) {\n      trip {\n        id\n        title\n        country\n        description\n        lat\n        lng\n        startDate\n        endDate\n        status\n        coverPhoto\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.UpdateTripDocument,
    "\n  mutation DeleteTrip($id: ID!) {\n    deleteTrip(id: $id) {\n      success\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.DeleteTripDocument,
    "\n  mutation PublishTrip($id: ID!) {\n    publishTrip(id: $id) {\n      trip {\n        id\n        status\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.PublishTripDocument,
    "\n  mutation UnpublishTrip($id: ID!) {\n    unpublishTrip(id: $id) {\n      trip {\n        id\n        status\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.UnpublishTripDocument,
    "\n  mutation CloseTrip($id: ID!, $input: CloseTripInput!) {\n    closeTrip(id: $id, input: $input) {\n      trip {\n        id\n        status\n        startDate\n        endDate\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.CloseTripDocument,
    "\n  mutation ReopenTrip($id: ID!) {\n    reopenTrip(id: $id) {\n      trip {\n        id\n        status\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.ReopenTripDocument,
    "\n  query Trips($status: [TripStatus!]) {\n    trips(status: $status) {\n      id\n      title\n      country\n      lat\n      lng\n      startDate\n      endDate\n      status\n      coverPhoto\n    }\n  }\n": types.TripsDocument,
};

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown;

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateAccount($input: CreateAccountInput!) {\n    createAccount(input: $input) {\n      account {\n        id\n        name\n        email\n        role\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateAccount($input: CreateAccountInput!) {\n    createAccount(input: $input) {\n      account {\n        id\n        name\n        email\n        role\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation DeleteAccount($id: ID!) {\n    deleteAccount(id: $id) {\n      success\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteAccount($id: ID!) {\n    deleteAccount(id: $id) {\n      success\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation ChangePassword($input: ChangePasswordInput!) {\n    changePassword(input: $input) {\n      account {\n        id\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation ChangePassword($input: ChangePasswordInput!) {\n    changePassword(input: $input) {\n      account {\n        id\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query Accounts {\n    accounts {\n      id\n      name\n      email\n      role\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query Accounts {\n    accounts {\n      id\n      name\n      email\n      role\n      createdAt\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation RequestPasswordReset($email: String!) {\n    requestPasswordReset(email: $email)\n  }\n"): (typeof documents)["\n  mutation RequestPasswordReset($email: String!) {\n    requestPasswordReset(email: $email)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation Login($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      token\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation Login($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      token\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation ResetPassword($input: ResetPasswordInput!) {\n    resetPassword(input: $input) {\n      account {\n        id\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation ResetPassword($input: ResetPasswordInput!) {\n    resetPassword(input: $input) {\n      account {\n        id\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation SetupAdmin($input: SetupAdminInput!) {\n    setupAdmin(input: $input) {\n      token\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation SetupAdmin($input: SetupAdminInput!) {\n    setupAdmin(input: $input) {\n      token\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation Logout {\n    logout\n  }\n"): (typeof documents)["\n  mutation Logout {\n    logout\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query Me {\n    me {\n      id\n      name\n      email\n      role\n    }\n  }\n"): (typeof documents)["\n  query Me {\n    me {\n      id\n      name\n      email\n      role\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query SetupStatus {\n    setupStatus {\n      done\n    }\n  }\n"): (typeof documents)["\n  query SetupStatus {\n    setupStatus {\n      done\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateMediaCaption($id: ID!, $caption: String) {\n    updateMediaCaption(id: $id, caption: $caption) {\n      media {\n        id\n        caption\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateMediaCaption($id: ID!, $caption: String) {\n    updateMediaCaption(id: $id, caption: $caption) {\n      media {\n        id\n        caption\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation ReorderMedia($visitID: ID!, $mediaIDs: [ID!]!) {\n    reorderMedia(visitID: $visitID, mediaIDs: $mediaIDs) {\n      media {\n        id\n        position\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation ReorderMedia($visitID: ID!, $mediaIDs: [ID!]!) {\n    reorderMedia(visitID: $visitID, mediaIDs: $mediaIDs) {\n      media {\n        id\n        position\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation DeleteMedia($id: ID!) {\n    deleteMedia(id: $id) {\n      success\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteMedia($id: ID!) {\n    deleteMedia(id: $id) {\n      success\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation ReorderTravelLegMedia($travelLegID: ID!, $mediaIDs: [ID!]!) {\n    reorderTravelLegMedia(travelLegID: $travelLegID, mediaIDs: $mediaIDs) {\n      media {\n        id\n        position\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation ReorderTravelLegMedia($travelLegID: ID!, $mediaIDs: [ID!]!) {\n    reorderTravelLegMedia(travelLegID: $travelLegID, mediaIDs: $mediaIDs) {\n      media {\n        id\n        position\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query VisitMedia($visitID: ID!) {\n    visitMedia(visitID: $visitID) {\n      id\n      visitID\n      tripID\n      filename\n      contentType\n      caption\n      url\n      thumbUrl\n      position\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query VisitMedia($visitID: ID!) {\n    visitMedia(visitID: $visitID) {\n      id\n      visitID\n      tripID\n      filename\n      contentType\n      caption\n      url\n      thumbUrl\n      position\n      createdAt\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query TravelLegMedia($travelLegID: ID!) {\n    travelLegMedia(travelLegID: $travelLegID) {\n      id\n      visitID\n      travelLegID\n      tripID\n      filename\n      contentType\n      caption\n      url\n      thumbUrl\n      position\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query TravelLegMedia($travelLegID: ID!) {\n    travelLegMedia(travelLegID: $travelLegID) {\n      id\n      visitID\n      travelLegID\n      tripID\n      filename\n      contentType\n      caption\n      url\n      thumbUrl\n      position\n      createdAt\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query TripMedia($tripID: ID!) {\n    tripMedia(tripID: $tripID) {\n      id\n      visitID\n      tripID\n      contentType\n      thumbUrl\n    }\n  }\n"): (typeof documents)["\n  query TripMedia($tripID: ID!) {\n    tripMedia(tripID: $tripID) {\n      id\n      visitID\n      tripID\n      contentType\n      thumbUrl\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation AddStage($input: AddStageInput!) {\n    addStage(input: $input) {\n      stage {\n        id\n        tripID\n        city\n        displayName\n        lat\n        lng\n        description\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation AddStage($input: AddStageInput!) {\n    addStage(input: $input) {\n      stage {\n        id\n        tripID\n        city\n        displayName\n        lat\n        lng\n        description\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateStage($id: ID!, $input: UpdateStageInput!) {\n    updateStage(id: $id, input: $input) {\n      stage {\n        id\n        tripID\n        city\n        displayName\n        lat\n        lng\n        description\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateStage($id: ID!, $input: UpdateStageInput!) {\n    updateStage(id: $id, input: $input) {\n      stage {\n        id\n        tripID\n        city\n        displayName\n        lat\n        lng\n        description\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation DeleteStage($id: ID!) {\n    deleteStage(id: $id) {\n      success\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteStage($id: ID!) {\n    deleteStage(id: $id) {\n      success\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query Stages($tripID: ID!) {\n    stages(tripID: $tripID) {\n      id\n      tripID\n      city\n      displayName\n      lat\n      lng\n      description\n    }\n  }\n"): (typeof documents)["\n  query Stages($tripID: ID!) {\n    stages(tripID: $tripID) {\n      id\n      tripID\n      city\n      displayName\n      lat\n      lng\n      description\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query TripVisits($tripID: ID!) {\n    tripVisits(tripID: $tripID) {\n      id\n      tripID\n      stageIDs\n      date\n      title\n      description\n      lat\n      lng\n      position\n    }\n  }\n"): (typeof documents)["\n  query TripVisits($tripID: ID!) {\n    tripVisits(tripID: $tripID) {\n      id\n      tripID\n      stageIDs\n      date\n      title\n      description\n      lat\n      lng\n      position\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation AddVisit($input: AddVisitInput!) {\n    addVisit(input: $input) {\n      visit {\n        id\n        tripID\n        stageIDs\n        date\n        title\n        description\n        lat\n        lng\n        position\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation AddVisit($input: AddVisitInput!) {\n    addVisit(input: $input) {\n      visit {\n        id\n        tripID\n        stageIDs\n        date\n        title\n        description\n        lat\n        lng\n        position\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateVisit($id: ID!, $input: UpdateVisitInput!) {\n    updateVisit(id: $id, input: $input) {\n      visit {\n        id\n        tripID\n        stageIDs\n        date\n        title\n        description\n        lat\n        lng\n        position\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateVisit($id: ID!, $input: UpdateVisitInput!) {\n    updateVisit(id: $id, input: $input) {\n      visit {\n        id\n        tripID\n        stageIDs\n        date\n        title\n        description\n        lat\n        lng\n        position\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation DeleteVisit($id: ID!) {\n    deleteVisit(id: $id) {\n      success\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteVisit($id: ID!) {\n    deleteVisit(id: $id) {\n      success\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation ReorderVisits($stageID: ID!, $date: String!, $visitIDs: [ID!]!) {\n    reorderVisits(stageID: $stageID, date: $date, visitIDs: $visitIDs) {\n      visits {\n        id\n        position\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation ReorderVisits($stageID: ID!, $date: String!, $visitIDs: [ID!]!) {\n    reorderVisits(stageID: $stageID, date: $date, visitIDs: $visitIDs) {\n      visits {\n        id\n        position\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query Visits($stageID: ID!) {\n    visits(stageID: $stageID) {\n      id\n      tripID\n      stageIDs\n      date\n      title\n      description\n      lat\n      lng\n      position\n    }\n  }\n"): (typeof documents)["\n  query Visits($stageID: ID!) {\n    visits(stageID: $stageID) {\n      id\n      tripID\n      stageIDs\n      date\n      title\n      description\n      lat\n      lng\n      position\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateTravelLeg($input: CreateTravelLegInput!) {\n    createTravelLeg(input: $input) {\n      travelLeg {\n        id\n        tripID\n        fromStageID\n        toStageID\n        transport\n        description\n        distanceKm\n        createdAt\n        updatedAt\n      }\n      errors { field message }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateTravelLeg($input: CreateTravelLegInput!) {\n    createTravelLeg(input: $input) {\n      travelLeg {\n        id\n        tripID\n        fromStageID\n        toStageID\n        transport\n        description\n        distanceKm\n        createdAt\n        updatedAt\n      }\n      errors { field message }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateTravelLeg($id: ID!, $input: UpdateTravelLegInput!) {\n    updateTravelLeg(id: $id, input: $input) {\n      travelLeg {\n        id\n        tripID\n        fromStageID\n        toStageID\n        transport\n        description\n        distanceKm\n        createdAt\n        updatedAt\n      }\n      errors { field message }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateTravelLeg($id: ID!, $input: UpdateTravelLegInput!) {\n    updateTravelLeg(id: $id, input: $input) {\n      travelLeg {\n        id\n        tripID\n        fromStageID\n        toStageID\n        transport\n        description\n        distanceKm\n        createdAt\n        updatedAt\n      }\n      errors { field message }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation MoveTravelLeg($id: ID!, $input: MoveTravelLegInput!) {\n    moveTravelLeg(id: $id, input: $input) {\n      travelLeg {\n        id\n        tripID\n        fromStageID\n        toStageID\n        transport\n        description\n        distanceKm\n        createdAt\n        updatedAt\n      }\n      errors { field message }\n    }\n  }\n"): (typeof documents)["\n  mutation MoveTravelLeg($id: ID!, $input: MoveTravelLegInput!) {\n    moveTravelLeg(id: $id, input: $input) {\n      travelLeg {\n        id\n        tripID\n        fromStageID\n        toStageID\n        transport\n        description\n        distanceKm\n        createdAt\n        updatedAt\n      }\n      errors { field message }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation DeleteTravelLeg($id: ID!) {\n    deleteTravelLeg(id: $id) {\n      success\n      errors { field message }\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteTravelLeg($id: ID!) {\n    deleteTravelLeg(id: $id) {\n      success\n      errors { field message }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CalculateTravelLegDistance($fromStageID: ID!, $toStageID: ID!, $transport: TravelLegTransport!) {\n    calculateTravelLegDistance(fromStageID: $fromStageID, toStageID: $toStageID, transport: $transport) {\n      distanceKm\n      errors { field message }\n    }\n  }\n"): (typeof documents)["\n  mutation CalculateTravelLegDistance($fromStageID: ID!, $toStageID: ID!, $transport: TravelLegTransport!) {\n    calculateTravelLegDistance(fromStageID: $fromStageID, toStageID: $toStageID, transport: $transport) {\n      distanceKm\n      errors { field message }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query Trip($id: ID!) {\n    trip(id: $id) {\n      id\n      title\n      country\n      description\n      lat\n      lng\n      startDate\n      endDate\n      status\n      coverPhoto\n    }\n  }\n"): (typeof documents)["\n  query Trip($id: ID!) {\n    trip(id: $id) {\n      id\n      title\n      country\n      description\n      lat\n      lng\n      startDate\n      endDate\n      status\n      coverPhoto\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query TripCloseData($tripID: ID!) {\n    stages(tripID: $tripID) {\n      id\n      tripID\n    }\n    tripVisits(tripID: $tripID) {\n      id\n      tripID\n      date\n      stageIDs\n    }\n  }\n"): (typeof documents)["\n  query TripCloseData($tripID: ID!) {\n    stages(tripID: $tripID) {\n      id\n      tripID\n    }\n    tripVisits(tripID: $tripID) {\n      id\n      tripID\n      date\n      stageIDs\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query TripDetail($id: ID!) {\n    trip(id: $id) {\n      id\n      title\n      country\n      description\n      lat\n      lng\n      startDate\n      endDate\n      status\n      coverPhoto\n    }\n    stages(tripID: $id) {\n      id\n      tripID\n      city\n      displayName\n      lat\n      lng\n      description\n    }\n    tripVisits(tripID: $id) {\n      id\n      tripID\n      stageIDs\n      date\n      title\n      description\n      lat\n      lng\n      position\n    }\n    travelLegs(tripID: $id) {\n      id\n      tripID\n      fromStageID\n      toStageID\n      transport\n      description\n      distanceKm\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query TripDetail($id: ID!) {\n    trip(id: $id) {\n      id\n      title\n      country\n      description\n      lat\n      lng\n      startDate\n      endDate\n      status\n      coverPhoto\n    }\n    stages(tripID: $id) {\n      id\n      tripID\n      city\n      displayName\n      lat\n      lng\n      description\n    }\n    tripVisits(tripID: $id) {\n      id\n      tripID\n      stageIDs\n      date\n      title\n      description\n      lat\n      lng\n      position\n    }\n    travelLegs(tripID: $id) {\n      id\n      tripID\n      fromStageID\n      toStageID\n      transport\n      description\n      distanceKm\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateTrip($input: CreateTripInput!) {\n    createTrip(input: $input) {\n      trip {\n        id\n        title\n        country\n        description\n        lat\n        lng\n        startDate\n        endDate\n        status\n        coverPhoto\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateTrip($input: CreateTripInput!) {\n    createTrip(input: $input) {\n      trip {\n        id\n        title\n        country\n        description\n        lat\n        lng\n        startDate\n        endDate\n        status\n        coverPhoto\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateTrip($id: ID!, $input: UpdateTripInput!) {\n    updateTrip(id: $id, input: $input) {\n      trip {\n        id\n        title\n        country\n        description\n        lat\n        lng\n        startDate\n        endDate\n        status\n        coverPhoto\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateTrip($id: ID!, $input: UpdateTripInput!) {\n    updateTrip(id: $id, input: $input) {\n      trip {\n        id\n        title\n        country\n        description\n        lat\n        lng\n        startDate\n        endDate\n        status\n        coverPhoto\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation DeleteTrip($id: ID!) {\n    deleteTrip(id: $id) {\n      success\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteTrip($id: ID!) {\n    deleteTrip(id: $id) {\n      success\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation PublishTrip($id: ID!) {\n    publishTrip(id: $id) {\n      trip {\n        id\n        status\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation PublishTrip($id: ID!) {\n    publishTrip(id: $id) {\n      trip {\n        id\n        status\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UnpublishTrip($id: ID!) {\n    unpublishTrip(id: $id) {\n      trip {\n        id\n        status\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UnpublishTrip($id: ID!) {\n    unpublishTrip(id: $id) {\n      trip {\n        id\n        status\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CloseTrip($id: ID!, $input: CloseTripInput!) {\n    closeTrip(id: $id, input: $input) {\n      trip {\n        id\n        status\n        startDate\n        endDate\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CloseTrip($id: ID!, $input: CloseTripInput!) {\n    closeTrip(id: $id, input: $input) {\n      trip {\n        id\n        status\n        startDate\n        endDate\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation ReopenTrip($id: ID!) {\n    reopenTrip(id: $id) {\n      trip {\n        id\n        status\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation ReopenTrip($id: ID!) {\n    reopenTrip(id: $id) {\n      trip {\n        id\n        status\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query Trips($status: [TripStatus!]) {\n    trips(status: $status) {\n      id\n      title\n      country\n      lat\n      lng\n      startDate\n      endDate\n      status\n      coverPhoto\n    }\n  }\n"): (typeof documents)["\n  query Trips($status: [TripStatus!]) {\n    trips(status: $status) {\n      id\n      title\n      country\n      lat\n      lng\n      startDate\n      endDate\n      status\n      coverPhoto\n    }\n  }\n"];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;