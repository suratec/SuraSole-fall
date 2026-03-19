import React, { Component } from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { Card } from '../../common/NativeBaseShim';

import Text from '../../common/TextFix'
import ListItem from './listtagging';

import { connect } from 'react-redux';

findDuration = data => {
    return data.reduce((a, b) => a + b.duration, 0);
}

toKilo = (value) => {
    return ((5.6 * 10 ** -4) * Math.exp(value / 53.36) + 6.72) / 0.796
}

getStepAndLenght = (data) => {
    let step = 0;
    let isLeft = false;
    let isRight = false;
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].left.length; j++) {
            let leftSide = data[i].left[j].reduce((a, b) => a + b, 0);
            let rightSide = data[i].right[j].reduce((a, b) => a + b, 0);
            if (Math.abs(leftSide - rightSide) > 1000) {
                if (leftSide > rightSide && !isLeft) {
                    step += 1;
                    isLeft = true;
                    isRight = false;
                }
                else if (rightSide > leftSide && !isRight) {
                    step += 1;
                    isLeft = false;
                    isRight = true;
                }
            }
        }
    }
    return step;
}

findPeak = (data) => {
    if (Array.isArray(data)) {
        let max = 0;
        data.forEach(e => {
            if (Number(e.valuePeak) > max) {
                max = Number(e.valuePeak);
            }
        });
        return max;
    }
    else {
        return 0;
    }
}

findSwing = (data) => {
    let swing = 0;
    let all = 0;
    data.forEach(d => {
        for(let i = 1; i < d.left.length; i++){
            let currentleftX = ((d.left[i][0] + d.left[i][1] + d.left[i][2]) / 3) - d.left[i][4];
            let currentleftY = d.left[i][2] - d.left[i][1];
            let currentrightX = ((d.right[i][0] + d.right[i][1] + d.right[i][2]) / 3) - d.right[i][4];
            let currentrightY = d.right[i][2] - d.right[i][1];
            let currentX = (currentleftX + currentrightX) / 2;
            let currentY = (currentleftY + currentrightY) / 2;
            let previousleftX = ((d.left[i - 1][0] + d.left[i - 1][1] + d.left[i - 1][2]) / 3) - d.left[i - 1][4];
            let previousleftY = d.left[i - 1][2] - d.left[i - 1][1];
            let previousrightX = ((d.right[i - 1][0] + d.right[i - 1][1] + d.right[i - 1][2]) / 3) - d.right[i - 1][4];
            let previousrightY = d.right[i - 1][2] - d.right[i - 1][1];
            let previousX = (previousleftX + previousrightX) / 2;
            let previousY = (previousleftY + previousrightY) / 2;
            swing += Math.sqrt(Math.pow(previousX - currentX, 2) + Math.pow(previousY - currentY, 2));
        }
        all += d.left.length;
    });
    return swing / all;
}

class cards_tagging extends Component {
    constructor(props) {
        super(props);
        this.state = {
            step: 0,
            duration: 0,
            pace: 0,
            distance: 0,
            peak: 0,
            swing: 0
        }
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.data && nextProps.dataSpecified) {
            let duration = findDuration(nextProps.data);
            let step = getStepAndLenght(nextProps.data);
            let peak = findPeak(nextProps.dataSpecified);
            let swing = findSwing(nextProps.data);
            let distance = 0;
            if (nextProps.user.sex === 0) {
                distance = nextProps.user.height * 0.415 * step;
            } else {
                distance = nextProps.user.height * 0.413 * step;
            }
            let pace = (duration / 60) / (distance / 1000)
            isNaN(pace) || pace === Infinity ? pace = 0 : pace = pace;
            isNaN(swing) ? swing = 0 : swing = swing;
            return { duration, step, distance: (distance / 1000).toFixed(3), peak, pace: pace.toFixed(2), swing: swing.toFixed(2)};
        }
        return { ...prevState };
    }

    componentDidMount() {
    }


    render() {

        // let _data = this.props.data; //ส่งมาเป็น array หรือ json

        return (

            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row' }}>
                    <View style={{ marginLeft: 20, flex: 1, alignSelf: 'center' }} />
                    <Text styles={{ alignSelf: 'center', paddingHorizontal: 5 }}>Behavior tagging</Text>
                    <View style={{ marginRight: 20, flex: 1, alignSelf: 'center' }} />
                </View>

                <View style={{ padding: 15 }}>
                    <View style={styles.card}>
                        <View style={{ height: '3%' }}></View>

                        <ListItem
                            imageLeft={require('../../../assets/image/dashboard/time.png')}
                            titleNameLeft={'Duration'}
                            titleValueLeft={`${this.state.duration} s`}

                            imageRight={require('../../../assets/image/dashboard/dashboard.png')}
                            titleNameRight={'Avg. Pace'}
                            titleValueRight={`${this.state.pace} min/km`}
                        />

                        <ListItem
                            imageLeft={require('../../../assets/image/dashboard/pinpoint.png')}
                            titleNameLeft={'Avg Distance'}
                            titleValueLeft={`${this.state.distance} km`}

                            imageRight={require('../../../assets/image/dashboard/walking.png')}
                            titleNameRight={'Total Steps'}
                            titleValueRight={`${this.state.step}`}

                        />

                        {/* <ListItem
                            imageLeft={require('../../../assets/image/dashboard/heart.png')}
                            titleNameLeft={'Heart Rate'}
                            titleValueLeft={'- -'}

                            imageRight={require('../../../assets/image/dashboard/gas.png')}
                            titleNameRight={'Est. Calories'}
                            titleValueRight={'130 cal.'}
                        /> */}

                        <ListItem
                            imageLeft={require('../../../assets/image/dashboard/report.png')}
                            titleNameLeft={'Peak Pressure'}
                            titleValueLeft={`${this.state.peak} kPa`}

                            imageRight={require('../../../assets/image/dashboard/sine.png')}
                            titleNameRight={'CG Swing'}
                            titleValueRight={`${this.state.swing}`}
                        />

                        <View style={{ height: '3%' }}></View>
                    </View>
                </View>
            </View>
        )
    }
}

const mapStateToProps = state => {
    return {
        user: state.user,
    }
}

export default connect(mapStateToProps)(cards_tagging);

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        borderColor: '#dddddd',
        marginTop: 10,
        borderRadius: 4,
        marginBottom: 5,
    }
});
