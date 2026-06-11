const INIT_STATE = {
  lang: 0,
  user: null,
  token: null,
  leftDevice: null,
  rightDevice: null,
  isStart: false,
  isBlueToothOn: false,
  record: null,
  noti: false,
  data: [],
  selUser: false,
  chat: false,
  call: false,
  chatProfile: false,
  eightSensor: false,
  productID: null,
  impersonating: false,
  patient_id: null,
  patient_token: null,
};

const Reducer = (state = INIT_STATE, action = {}) => {
  switch (action.type) {
    case 'ADD_LEFT_DEVICE':
      return {
        ...state,
        leftDevice: action.payload,
      };
    case 'CHAT_PROFILE':
      return {
        ...state,
        chatProfile: action.payload,
      };
    case 'SELECTED_USER':
      return {
        ...state,
        selUser: action.payload,
      };
    case 'SELECTED_CHAT':
      return {
        ...state,
        chat: action.payload,
      };
    case 'START_CALL':
      return {
        ...state,
        call: action.payload,
      };
    case 'ADD_RIGHT_DEVICE':
      return {
        ...state,
        rightDevice: action.payload,
      };
    case 'RESET_RIGHT_DEVICE':
      return {
        ...state,
        rightDevice: null,
      };
    case 'RESET_LEFT_DEVICE':
      return {
        ...state,
        leftDevice: null,
      };
    case 'RESET_ALL_DEVICE':
      return {
        ...state,
        leftDevice: null,
        rightDevice: null,
      };
    case 'EDIT_LANG':
      return {
        ...state,
        lang: action.payload,
      };
    case 'ADD_USERINFO':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
      };
    case 'RESET_USERINFO':
      return {
        ...state,
        user: null,
        token: null,
      };
    case 'STARTING':
      return {
        ...state,
        isStart: true,
      };
    case 'READ_BLUETOOTH_STATE':
      return {
        ...state,
        isBlueToothOn: action.payload,
      };
    case 'ADD_BLUETOOTH_DATA':
      return {
        ...state,
        data: action.payload,
      };
    case 'EDIT_PROFILE_PATH':
      return {
        ...state,
        user: action.payload,
      };
    case 'ACTION_BUTTON_RECORD':
      return {
        ...state,
        record: action.payload,
      };
    case 'ACTION_BUTTON_NOTIFICATION':
      return {
        ...state,
        noti: action.payload,
      };
    case 'SENSOR_TYPE':
      return {
        ...state,
        eightSensor: action.payload,
      };
    case 'PRODUCT_ID':
      return {
        ...state,
        productNumber: action.payload,
      };
    case 'SET_IMPERSONATION':
      return {
        ...state,
        impersonating: action.payload
      };
    case 'SET_PATIENT_ID':
      return {
        ...state,
        patient_id: action.payload,
      };
    case 'SET_PATIENT_TOKEN':
      return {
        ...state,
        patient_token: action.payload,
      };
    default:
      return state;
  }
};

export default Reducer;
