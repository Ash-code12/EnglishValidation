import whatsappClient from "../../../clients/whatsappClient.js";
import sessionTracker from "../../../utils/sessionTracker.js";
import n8nClient from "../../../clients/n8nClient.js";
import { STATES } from "../../../utils/conversationState.js";

import InitialState from "./InitialState.js";
import GettingFullNameState from "./GettingFullNameState.js";
import GettingRecruiterNameState from "./GettingRecruiterNameState.js";
import GettingJobPositionState from "./GettingJobPositionState.js";
import QuestionState from "./QuestionState.js";
import FinishedState from "./FinishedState.js";
import config from "../../../config/env.js";

export default function getStateHandler(state) {
  try {
    const deps = { whatsappClient, sessionTracker, n8nClient, config };

    const stateMap = {
      [STATES.INITIAL]: new InitialState({ ...deps, nextState: STATES.GETTING_FULL_NAME }),
      [STATES.GETTING_FULL_NAME]: new GettingFullNameState({ ...deps, nextState: STATES.GETTING_RECRUITER_NAME }),
      [STATES.GETTING_RECRUITER_NAME]: new GettingRecruiterNameState({ ...deps, nextState: STATES.GETTING_JOB_POSITION }),
      [STATES.GETTING_JOB_POSITION]: new GettingJobPositionState({ ...deps, nextState: STATES.QUESTION_1 }),
      [STATES.QUESTION_1]: new QuestionState({ ...deps, questionNumber: 1, nextState: STATES.QUESTION_2 }),
      [STATES.QUESTION_2]: new QuestionState({ ...deps, questionNumber: 2, nextState: STATES.QUESTION_3 }),
      [STATES.QUESTION_3]: new QuestionState({ ...deps, questionNumber: 3, nextState: STATES.QUESTION_4 }),
      [STATES.QUESTION_4]: new QuestionState({ ...deps, questionNumber: 4, nextState: STATES.QUESTION_5 }),
      [STATES.QUESTION_5]: new QuestionState({ ...deps, questionNumber: 5, nextState: STATES.FINISHED }),
      [STATES.FINISHED]: new FinishedState(deps)
    };

    return stateMap[state];
  } catch (error) {
    throw error;
  }
}

