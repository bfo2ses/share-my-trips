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
    "\n  mutation RequestPasswordReset($email: String!) {\n    requestPasswordReset(email: $email)\n  }\n": typeof types.RequestPasswordResetDocument,
    "\n  mutation Login($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      token\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.LoginDocument,
    "\n  mutation ResetPassword($input: ResetPasswordInput!) {\n    resetPassword(input: $input) {\n      account {\n        id\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.ResetPasswordDocument,
    "\n  mutation SetupAdmin($input: SetupAdminInput!) {\n    setupAdmin(input: $input) {\n      token\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.SetupAdminDocument,
    "\n  mutation Logout {\n    logout\n  }\n": typeof types.LogoutDocument,
    "\n  query Me {\n    me {\n      id\n      name\n      email\n      role\n    }\n  }\n": typeof types.MeDocument,
    "\n  query SetupStatus {\n    setupStatus {\n      done\n    }\n  }\n": typeof types.SetupStatusDocument,
    "\n  mutation AddDay($input: AddDayInput!) {\n    addDay(input: $input) {\n      day {\n        id\n        tripID\n        stageIDs\n        date\n        title\n        description\n        lat\n        lng\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.AddDayDocument,
    "\n  mutation UpdateDay($id: ID!, $input: UpdateDayInput!) {\n    updateDay(id: $id, input: $input) {\n      day {\n        id\n        tripID\n        stageIDs\n        date\n        title\n        description\n        lat\n        lng\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.UpdateDayDocument,
    "\n  mutation DeleteDay($id: ID!) {\n    deleteDay(id: $id) {\n      success\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.DeleteDayDocument,
    "\n  query Days($stageID: ID!) {\n    days(stageID: $stageID) {\n      id\n      tripID\n      stageIDs\n      date\n      title\n      description\n      lat\n      lng\n    }\n  }\n": typeof types.DaysDocument,
    "\n  mutation AddStage($input: AddStageInput!) {\n    addStage(input: $input) {\n      stage {\n        id\n        tripID\n        city\n        displayName\n        lat\n        lng\n        description\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.AddStageDocument,
    "\n  mutation UpdateStage($id: ID!, $input: UpdateStageInput!) {\n    updateStage(id: $id, input: $input) {\n      stage {\n        id\n        tripID\n        city\n        displayName\n        lat\n        lng\n        description\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.UpdateStageDocument,
    "\n  mutation DeleteStage($id: ID!) {\n    deleteStage(id: $id) {\n      success\n      errors {\n        field\n        message\n      }\n    }\n  }\n": typeof types.DeleteStageDocument,
    "\n  query Stages($tripID: ID!) {\n    stages(tripID: $tripID) {\n      id\n      tripID\n      city\n      displayName\n      lat\n      lng\n      description\n    }\n  }\n": typeof types.StagesDocument,
    "\n  query Trip($id: ID!) {\n    trip(id: $id) {\n      id\n      title\n      country\n      description\n      lat\n      lng\n      startDate\n      endDate\n      status\n      coverPhoto\n    }\n  }\n": typeof types.TripDocument,
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
    "\n  mutation RequestPasswordReset($email: String!) {\n    requestPasswordReset(email: $email)\n  }\n": types.RequestPasswordResetDocument,
    "\n  mutation Login($email: String!, $password: String!) {\n    login(email: $email, password: $password) {\n      token\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.LoginDocument,
    "\n  mutation ResetPassword($input: ResetPasswordInput!) {\n    resetPassword(input: $input) {\n      account {\n        id\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.ResetPasswordDocument,
    "\n  mutation SetupAdmin($input: SetupAdminInput!) {\n    setupAdmin(input: $input) {\n      token\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.SetupAdminDocument,
    "\n  mutation Logout {\n    logout\n  }\n": types.LogoutDocument,
    "\n  query Me {\n    me {\n      id\n      name\n      email\n      role\n    }\n  }\n": types.MeDocument,
    "\n  query SetupStatus {\n    setupStatus {\n      done\n    }\n  }\n": types.SetupStatusDocument,
    "\n  mutation AddDay($input: AddDayInput!) {\n    addDay(input: $input) {\n      day {\n        id\n        tripID\n        stageIDs\n        date\n        title\n        description\n        lat\n        lng\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.AddDayDocument,
    "\n  mutation UpdateDay($id: ID!, $input: UpdateDayInput!) {\n    updateDay(id: $id, input: $input) {\n      day {\n        id\n        tripID\n        stageIDs\n        date\n        title\n        description\n        lat\n        lng\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.UpdateDayDocument,
    "\n  mutation DeleteDay($id: ID!) {\n    deleteDay(id: $id) {\n      success\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.DeleteDayDocument,
    "\n  query Days($stageID: ID!) {\n    days(stageID: $stageID) {\n      id\n      tripID\n      stageIDs\n      date\n      title\n      description\n      lat\n      lng\n    }\n  }\n": types.DaysDocument,
    "\n  mutation AddStage($input: AddStageInput!) {\n    addStage(input: $input) {\n      stage {\n        id\n        tripID\n        city\n        displayName\n        lat\n        lng\n        description\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.AddStageDocument,
    "\n  mutation UpdateStage($id: ID!, $input: UpdateStageInput!) {\n    updateStage(id: $id, input: $input) {\n      stage {\n        id\n        tripID\n        city\n        displayName\n        lat\n        lng\n        description\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.UpdateStageDocument,
    "\n  mutation DeleteStage($id: ID!) {\n    deleteStage(id: $id) {\n      success\n      errors {\n        field\n        message\n      }\n    }\n  }\n": types.DeleteStageDocument,
    "\n  query Stages($tripID: ID!) {\n    stages(tripID: $tripID) {\n      id\n      tripID\n      city\n      displayName\n      lat\n      lng\n      description\n    }\n  }\n": types.StagesDocument,
    "\n  query Trip($id: ID!) {\n    trip(id: $id) {\n      id\n      title\n      country\n      description\n      lat\n      lng\n      startDate\n      endDate\n      status\n      coverPhoto\n    }\n  }\n": types.TripDocument,
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
export function gql(source: "\n  mutation AddDay($input: AddDayInput!) {\n    addDay(input: $input) {\n      day {\n        id\n        tripID\n        stageIDs\n        date\n        title\n        description\n        lat\n        lng\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation AddDay($input: AddDayInput!) {\n    addDay(input: $input) {\n      day {\n        id\n        tripID\n        stageIDs\n        date\n        title\n        description\n        lat\n        lng\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateDay($id: ID!, $input: UpdateDayInput!) {\n    updateDay(id: $id, input: $input) {\n      day {\n        id\n        tripID\n        stageIDs\n        date\n        title\n        description\n        lat\n        lng\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateDay($id: ID!, $input: UpdateDayInput!) {\n    updateDay(id: $id, input: $input) {\n      day {\n        id\n        tripID\n        stageIDs\n        date\n        title\n        description\n        lat\n        lng\n      }\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation DeleteDay($id: ID!) {\n    deleteDay(id: $id) {\n      success\n      errors {\n        field\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteDay($id: ID!) {\n    deleteDay(id: $id) {\n      success\n      errors {\n        field\n        message\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query Days($stageID: ID!) {\n    days(stageID: $stageID) {\n      id\n      tripID\n      stageIDs\n      date\n      title\n      description\n      lat\n      lng\n    }\n  }\n"): (typeof documents)["\n  query Days($stageID: ID!) {\n    days(stageID: $stageID) {\n      id\n      tripID\n      stageIDs\n      date\n      title\n      description\n      lat\n      lng\n    }\n  }\n"];
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
export function gql(source: "\n  query Trip($id: ID!) {\n    trip(id: $id) {\n      id\n      title\n      country\n      description\n      lat\n      lng\n      startDate\n      endDate\n      status\n      coverPhoto\n    }\n  }\n"): (typeof documents)["\n  query Trip($id: ID!) {\n    trip(id: $id) {\n      id\n      title\n      country\n      description\n      lat\n      lng\n      startDate\n      endDate\n      status\n      coverPhoto\n    }\n  }\n"];
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