import whatsappService from "../services/whatsappService.js";
import sessionService from "../services/sessionService.js";
import messageValidator from "../services/messageValidator.js";
import { STATES } from "../utils/conversationState.js";

import InitialState from "./InitialState.js";
import GettingFullNameState from "./GettingFullNameState.js";
import GettingRecruiterNameState from "./GettingRecruiterNameState.js";
import GettingJobPositionState from "./GettingJobPositionState.js";
import QuestionState from "./QuestionState.js";
import FinishedState from "./FinishedState.js";
import config from "../../../config/env.js";

export default {
  getStateHandler(state) {
    const deps = { whatsappService, sessionService, messageValidator, config };

    const stateMap = {
      [STATES.INITIAL]: new InitialState({... deps, nextState: STATES.GETTING_FULL_NAME}),
      [STATES.GETTING_FULL_NAME]: new GettingFullNameState({... deps, nextState: STATES.GETTING_RECRUITER_NAME}),
      [STATES.GETTING_RECRUITER_NAME]: new GettingRecruiterNameState({... deps, nextState: STATES.GETTING_JOB_POSITION}),
      [STATES.GETTING_JOB_POSITION]: new GettingJobPositionState({... deps, nextState: STATES.QUESTION_1}),
      [STATES.QUESTION_1]: new QuestionState({ ...deps, questionNumber: 1, nextState: STATES.QUESTION_2 }),
      [STATES.QUESTION_2]: new QuestionState({ ...deps, questionNumber: 2, nextState: STATES.QUESTION_3 }),
      [STATES.QUESTION_3]: new QuestionState({ ...deps, questionNumber: 3, nextState: STATES.QUESTION_4 }),
      [STATES.QUESTION_4]: new QuestionState({ ...deps, questionNumber: 4, nextState: STATES.QUESTION_5 }),
      [STATES.QUESTION_5]: new QuestionState({ ...deps, questionNumber: 5, nextState: null }),
      [STATES.FINISHED]: new FinishedState(deps)
    };

    return stateMap[state];
  }
};
