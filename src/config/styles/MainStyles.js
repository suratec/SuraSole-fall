import {StyleSheet, Dimensions} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import UI from './CommonStyles';
const {width} = Dimensions.get('window');

const Fonts = {
  family: {
    _default: '', //'Helvetica',
  },
  size: {
    _default: 14,
    h1: 30,
    h2: 28,
    h3: 26,
    h4: 22,
    h5: 20,
  },
};

//////////////////////////////////
//////////////////////////////////
///// COLORS
//////////////////////////////////
const Colors = {
  _default: '#333',
  _white: '#FFFFFF',
  _container: '#FFFFFF',
  _black: '#000000',
  _text_color: '#000',
  _gray_dark: '#DAD9E2',
  _gray_light: '#707070',
  _txtgray: '#C1C0C9',
  _link: '#9843F6',
  _txtprimary: '#262628',
  _yelloish: '#FFC700',
  _red: '#C24D34',
  _blue_gradient: ['#B83AF3', '#6950FB'],
  _white_gradient: ['#FFF', '#FFF'],
  _pink_gradient: ['#FF8960', '#FF62A5'],
  _gren_gradient: ['#BEE700', '#8ACA00'],
  _redi_gradient: ['#FF8960', '#FF62A5'],
  _blis_gradient: ['#00B4FF', '#1A74FF'],
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#dddddd',
    marginTop: 0,
    borderRadius: 4,
    marginBottom: 5,
  },
  h1: {
    fontSize: 20,
    fontWeight: '400',
  },
  h2: {
    fontSize: 16,
    fontWeight: '400',
  },
  h3: {
    fontSize: 14,
    fontWeight: '300',
  },
  h4: {
    fontSize: 12,
    fontWeight: '300',
  },
  bottomCard: {
    height: 90,
    width: '100%',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  roundUser: {
    width: 45,
    height: 45,
    borderRadius: 50,
    borderColor:"#eee",
    borderWidth:1
  },
  badgeDefault:{
    width: 100,
    height: 35,
    borderRadius: 10,
    color:"#fff",
    backgroundColor: Colors._gray_light,
  },
  badge1:{
    width: 80,
    fontSize:12,
    height: 25,
    paddingLeft:10,
    paddingTop:5,
    borderRadius: 30,
    color:"#fff",
    backgroundColor: Colors._gray_dark,
  },
  badge2:{
    width: 80,
    fontSize:12,
    height: 25,
    paddingLeft:10,
    paddingTop:5,
    borderRadius: 30,
    color:"#fff",
    backgroundColor: Colors._red,
  },
  badge3:{
    width: 80,
    fontSize:12,
    height: 25,
    paddingLeft:10,
    paddingTop:5,
    borderRadius: 30,
    color:"#fff",
    backgroundColor: '#fcad03',
  },
  badge4:{
    width: 80,
    fontSize:12,
    height: 25,
    paddingLeft:10,
    paddingTop:5,
    borderRadius: 30,
    color:"#fff",
    backgroundColor: 'teal',
  },
  badge5:{
    width: 80,
    fontSize:12,
    height: 25,
    paddingLeft:10,
    paddingTop:5,
    borderRadius: 30,
    color:"#fff",
    backgroundColor:  '#1fc25d',
  },
  badge6:{
    width: 80,
    fontSize:12,
    height: 25,
    paddingLeft:10,
    paddingTop:5,
    borderRadius: 30,
    color:"#fff",
    backgroundColor:'orange',
  },
  textInput: {
    backgroundColor: Colors._gray_dark,
    padding: 4,
    paddingHorizontal: 8,
    marginVertical: 4,
    borderRadius: 3,
    height: 35,
    flexDirection: 'row',
  },

  input: {
    flex: 1,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },

  shadow: {
    borderWidth: 0,
    shadowColor: '#aaa',
    shadowOpacity: 0.7,
    shadowRadius: 3,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },

  socialButton: {
    width: 40,
    height: 40,
    marginHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pt: {
    fontSize: Fonts.size.h5,
    fontWeight: 'bold',
  },

  ptt: {
    color: '#aaa',
  },

  pttt: {
    alignItems: 'center',
  },

  nb: {
    marginTop: 20,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  hb: {
    backgroundColor: Colors._white,
    width: 60,
    borderRadius: 30,
  },

  toptab: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },

  topactive: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },

  ttext: {
    color: Colors._white,
  },

  topt: {
    marginHorizontal: 2,
    borderRadius: 30,
    overflow: 'hidden',
  },

  stt: {
    fontSize: 12,
    color: Colors._white,
  },

  bb: {
    paddingRight: 6,
    borderRadius: 30,
  },

  tht: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginRight: 6,
    marginLeft: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tpad: {
    marginHorizontal: 3,
  },

  ppp: {
    marginHorizontal: 3,
  },

  btgifts: {
    padding: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },

  tgifts: {
    color: Colors._white,
    fontSize: Fonts.size.h6,
    paddingLeft: 4,
  },

  tgifts_gray: {
    color: Colors._gray_light,
    fontSize: Fonts.size.h6,
    paddingLeft: 4,
  },
  btnAddNew: {
    backgroundColor: Colors._red,
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors._white,
    textAlign: 'center',
    paddingTop: 12,
    height: 52,
    width: '65%',
    paddingLeft: 5,
    alignSelf: 'flex-end',
    borderRadius: 30,
  },
  btnAdd: {
    height: 60,
    width: '100%',
    left: 80,
    top: -5,
    flexDirection: 'row',
  },
  btnAddView: {
    padding: 6,
    borderRadius: 20,
    left: '28%',
    top: -65,
    width: '70%',
  },
  loader:{
    position:'absolute',
    flex:1,
    flexDirection:'row',
    justifyContent:'center',
    top:'45%',
    left:'45%',
    zIndex:999
  },
  btnText: {
    paddingHorizontal: 5,
    height: 60,
    borderRadius: 30,
    color: Colors._text_color,
    fontFamily: 'Lato-Regular',
    borderColor:'#eee',
    width: '95%',
    borderWidth: 1,
    fontSize: 15,
    backgroundColor: Colors._white,
    fontWeight: 'bold',
    paddingLeft: 45,
  },
  ti_drop_2: {
    height: 50,
    borderRadius: 30,
    color: Colors._text_color,
    borderColor: Colors._gray_dark,
    width: '90%',
    fontSize: 16,
    borderWidth: 2,
    fontFamily: 'Lato-Regular',
    fontWeight: 'bold',
    paddingLeft: 20,
    paddingTop: 12,
  },
  btnDefault: {
    color: Colors._white,
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: UI.color_Gradient[0],
    padding: 10,
    textAlign: 'center',
    shadowColor: '#aaa',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderRadius: 20,
    height: 45,
    marginLeft: 5,
    width: 250,
    shadowOffset: {
      width: 2,
      height: 2,
    },
  },
  ti_drop_1: {
    height: 40,
    borderRadius: 30,
    color: Colors._text_color,
    borderBottomColor: Colors._red,
    width: '90%',
    borderBottomWidth: 2,
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    backgroundColor: Colors._white,
    fontWeight: 'bold',
    paddingLeft: 20,
  },
  btnViewGroupLeft: {
    borderRadius: 20,
    backgroundColor: Colors._white,
    top: 30,
    padding: 20,
    paddingBottom: 0,
    paddingTop: 0,
  },
  icon_left_filter: {
    left: 28,
    top: 12,
    zIndex: 50,
    position:'absolute'
  },
  textTitle: {
    color: Colors._gray_light,
    fontWeight: 'bold',
    textAlign: 'left',
    width: 160,
    lineHeight: 20,
    fontSize: 14,
    fontFamily: 'roboto',
  },
  textDesc: {
    color: '#ddd',
    textAlign: 'left',
    width: 160,
    lineHeight: 20,
    fontSize: 14,
    fontFamily: 'roboto',
  },
});

export default styles;
