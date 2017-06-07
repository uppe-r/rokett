// @flow
import React, { Component } from 'react';
import s from './TopBar.css';
import Icon from '../Icon/Icon';
import settings from '../../settings.json';

const { remote } = require('electron');

const { dialog } = remote;


const topHeaderStyle = {
  backgroundColor: settings.frame.secondaryColor,
};

export default class TopBar extends Component {

  chooseDirectory: Function;

  constructor() {
    super();
    this.chooseDirectory = this.chooseDirectory.bind(this);
  }

  chooseDirectory() {
    dialog.showOpenDialog({
      title: 'Select a folder',
      properties: ['openDirectory'],
    }, (folderPath) => {
      if (folderPath) {
        this.props.setActiveFolder(folderPath[0]);
      }
    });
  }

  render() {
    return (
      <div className={s.topBarWrapper} style={topHeaderStyle}>
        <div className={s.leftTopBar}>
          <Icon iconName="folder" iconFunction={this.chooseDirectory} />
        </div>
      </div>
    );
  }
}
