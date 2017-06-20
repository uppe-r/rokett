// @flow
import React, { Component } from 'react';
import { Treebeard } from 'react-treebeard';
import chokidar from 'chokidar';
import fs from 'fs';
import deep from 'deep-diff';
import s from './Tree.css';
import dirTree from '../../directory-tree';
// import settings from '../../settings.json';

const treeStyle = {
  tree: {
    base: {
      listStyle: 'none',
      backgroundColor: 'inherit',
      margin: 0,
      padding: '12.5px',
      color: '#FFF',
      fontFamily: 'rubikregular',
      fontSize: '1rem',
      width: '240px',
      maxWidth: '240px'
    },
    node: {
      base: {
        position: 'relative'
      },
      link: {
        cursor: 'pointer',
        position: 'relative',
        padding: '2px 15px',
        display: 'block',
        whiteSpace: 'nowrap'
      },
      activeLink: {
        background: '#484eaf',
      },
      toggle: {
        base: {
          position: 'relative',
          display: 'inline-block',
          verticalAlign: 'top',
          marginLeft: '0px',
          height: '24px',
          width: '24px'
        },
        wrapper: {
          position: 'absolute',
          top: '50%',
          left: '50%',
          margin: '-10px 0 0 -7px',
          height: '11px'
        },
        height: 9,
        width: 9,
        arrow: {
          fill: '#FFF',
          strokeWidth: 0
        }
      },
      header: {
        base: {
          display: 'inline-block',
          verticalAlign: 'top',
          color: '#FFF',
          opacity: '0.8'
        },
        connector: {
          width: '2px',
          height: '12px',
          borderLeft: 'solid 2px black',
          borderBottom: 'solid 2px black',
          position: 'absolute',
          top: '0px',
          left: '-21px'
        },
        title: {
          lineHeight: '24px',
          verticalAlign: 'middle'
        }
      },
      subtree: {
        listStyle: 'none',
        paddingLeft: '30px'
      },
      loading: {
        color: '#E2C089'
      }
    }
  }
};

export default class Tree extends Component {

  state: Object;
  onToggle: Function;
  editorContentCallback: Function;

  constructor() {
    super();
    this.state = {};
    this.onToggle = this.onToggle.bind(this);
    this.editorContentCallback = this.editorContentCallback.bind(this);
  }

  componentWillReceiveProps(nextProps: Object) {
    if (this.props.currentFolderPath !== nextProps.currentFolderPath) {
      const data = dirTree(nextProps.currentFolderPath);
      if (data) {
        this.setState({ data });
      } else return this.setState({ data: null });
      // Start watching the files inside the chosen directory,
      // ignore node_modules if it exists since... it's quite big

      const watcher = chokidar.watch(nextProps.currentFolderPath, { ignoreInitial: true, ignored: (/node_modules[/]?/) });
      const watchedPaths = watcher.getWatched();
      if (watchedPaths) {
        watcher.unwatch(this.props.currentFolderPath);
      }
      // @TODO: Try to get multiple fs events on a single 'on' method
      // doesn't look to be supported by chokidar ^
      watcher
        .on('add', (event) => {
          this.chokidarFired(event, nextProps);
        })
        .on('unlink', (event) => {
          this.chokidarFired(event, nextProps);
        })
        .on('unlinkDir', (event) => {
          this.chokidarFired(event, nextProps);
        })
        .on('addDir', (event) => {
          this.chokidarFired(event, nextProps);
        });
    }
  }

  chokidarFired(e: string, nP: Object) {
    const newData = dirTree(this.props.currentFolderPath);
    let currentData = this.state.data;
    const observableDiff = deep.observableDiff;
    observableDiff(currentData, newData, (d) => {
      if (!d.path || !(d.path.length > 0)) {
        currentData = {};
        return currentData;
      }
      // Apply all changes except those to the 'name' property...
      if (d.path.join('.').indexOf('toggled') === -1 && d.path.join('.').indexOf('active') === -1) {
        deep.applyChange(currentData, newData, d);
      }
    });
    return this.setState({ data: currentData });
  }

  /**
   * Triggers when any node present in the tree is clicked
   */
  onToggle(node: Object, toggled: boolean) {
    if (this.state.cursor) {
      const cursor = this.state.cursor;
      cursor.active = false;
      this.setState({ cursor });
    }
    const currentNode = node;
    currentNode.active = true;
    if (node.children) {
      currentNode.toggled = toggled;
    }
    if (node.extension || node.extension === '') { // file
      this.getFileContent(node.path);
    }
    this.setState({ cursor: node });
  }

  /**
   * Get the contents of the file just selected
   */
  getFileContent(path: string) {
    fs.readFile(path, 'utf8', (err, data) => {
      this.editorContentCallback(data, path);
    });
  }

  /**
   * Set the content of the editor
   */

  editorContentCallback(initContent: string, filePath: string) {
    const { setEditorContent } = this.props;
    setEditorContent(initContent, filePath);
  }

  render() {
    const treeSidebarStyle = {
      zIndex: 99,
      WebkitAppRegion: 'no-drag',
    };

    return (
      <div className={s.treeWrapper} style={{ background: 'rgba(28, 29, 37, 0.7)' }}>
        {(() => {
          console.log(this.state.data);
          if (this.state.data !== {} && this.state.data) {
            console.log(JSON.stringify(this.state.data));
            if (this.state.data === {}) {
              console.log("LUL??????");
            }
            return (
              <div className={s.fileTreeSidebar} style={treeSidebarStyle}>
                <Treebeard
                  data={this.state.data || {}}
                  onToggle={this.onToggle}
                  animations={false}
                  style={treeStyle}
                />
              </div>
            );
          }
          return (
            <div className={s.fileTreeInfoWrapper}>
              <div className={s.noFolderOpenIcon} />
              <p className={s.fileTreeInfo}>No files to show... <br /> :(</p>
            </div>
          );
        })()}
      </div>
    );
  }
}
