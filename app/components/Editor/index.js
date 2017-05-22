import React, { PropTypes } from 'react';
const appRoot = require('app-root-dir').get();

function noop() {}

class MonacoEditor extends React.Component {
  constructor(props) {
    super(props);
    this.__current_value = props.value;
  }
  componentDidMount() {
    this.afterViewInit();
  }
  componentWillUnmount() {
    this.destroyMonaco();
  }
  componentDidUpdate(prevProps) {
    const context = this.props.context || window;
    if (this.props.value !== this.__current_value) {
      // Always refer to the latest value
      this.__current_value = this.props.value;
      // Consider the situation of rendering 1+ times before the editor mounted
      if (this.editor) {
        this.__prevent_trigger_change_event = true;
        this.editor.setValue(this.__current_value);
        this.__prevent_trigger_change_event = false;
      }
    }
    if (prevProps.language !== this.props.language) {
      context.monaco.editor.setModelLanguage(this.editor.getModel(), this.props.language);
    }
  }
  editorWillMount(monaco) {
    const { editorWillMount } = this.props;
    editorWillMount(monaco);
  }
  editorDidMount(editor, monaco) {
    const { editorDidMount, onChange } = this.props;
    editorDidMount(editor, monaco);
    editor.onDidChangeModelContent(event => {
      const value = editor.getValue();

      // Always refer to the latest value
      this.__current_value = value;

      // Only invoking when user input changed
      if (!this.__prevent_trigger_change_event) {
        onChange(value, event);
      }
    });
  }
  afterViewInit() {
    if (process.env.NODE_ENV === 'development') {
      const amdRequire = global.require(`${appRoot}/node_modules/monaco-editor/min/vs/loader.js`).require;
      amdRequire.config({
        baseUrl: `${appRoot}/node_modules/monaco-editor/min/`
      });
      // workaround monaco-css not understanding the environment
      self.module = undefined;
      // workaround monaco-typescript not understanding the environment
      self.process.browser = true;
      amdRequire(['vs/editor/editor.main'], () => {
        this.initMonaco();
      });
    } else if (process.env.NODE_ENV === 'production') {
      const amdRequire = global.require('./node_modules/monaco-editor/min/vs/loader.js').require;
      amdRequire.config({
        baseUrl: './node_modules/monaco-editor/min/'
      });
      // workaround monaco-css not understanding the environment
      self.module = undefined;
      // workaround monaco-typescript not understanding the environment
      self.process.browser = true;
      amdRequire(['vs/editor/editor.main'], () => {
        this.initMonaco();
      });
    }
  }
  initMonaco() {
    const value = this.props.value !== null ? this.props.value : this.props.defaultValue;
    const { language, theme, options } = this.props;
    const containerElement = this.refs.container;
    const context = this.props.context || window;
    if (typeof context.monaco !== 'undefined') {
      // Before initializing monaco editor
      this.editorWillMount(context.monaco);
      this.editor = context.monaco.editor.create(containerElement, {
        value,
        language,
        theme,
        ...options,
      });
      window.addEventListener('resize', () => {
        const editorNode = document.getElementsByClassName(containerElement.className)[0];
        const parent = editorNode.parentElement;
        editorNode.style.width = `${parent.clientWidth}px`;
        editorNode.style.height = `${parent.clientHeight}px`;

        editorNode.firstElementChild.style.width = `${parent.clientWidth}px`;
        editorNode.firstElementChild.style.height = `${parent.clientHeight}px`;

        editorNode.firstElementChild.firstElementChild.style.width = `${parent.clientWidth}px`;
        editorNode.firstElementChild.firstElementChild.style.height = `${parent.clientHeight}px`;

        editorNode.firstElementChild.firstElementChild.firstElementChild.style.width = `${parent.clientWidth}px`;
        editorNode.firstElementChild.firstElementChild.firstElementChild.style.height = `${parent.clientHeight}px`;

        editorNode.getElementsByClassName('monaco-scrollable-element')[0].style.width = `${parent.clientWidth - 46}px`;
      });
      // After initializing monaco editor
      this.editorDidMount(this.editor, context.monaco);
    }
  }
  destroyMonaco() {
    if (typeof this.editor !== 'undefined') {
      this.editor.dispose();
    }
  }
  render() {
    const { width, height } = this.props;
    const fixedWidth = width.toString().indexOf('%') !== -1 ? width : `${width}px`;
    const fixedHeight = height.toString().indexOf('%') !== -1 ? height : `${height}px`;
    const style = {
      width: fixedWidth,
      height: fixedHeight,
    };
    return (
      <div ref="container" style={style} className="react-monaco-editor-container" />
    );
  }
}

MonacoEditor.propTypes = {
  width: PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.number,
  ]),
  height: PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.number,
  ]),
  value: PropTypes.string,
  defaultValue: PropTypes.string,
  language: PropTypes.string,
  theme: PropTypes.string,
  options: PropTypes.object,
  editorDidMount: PropTypes.func,
  editorWillMount: PropTypes.func,
  onChange: PropTypes.func,
  requireConfig: PropTypes.object,
};

MonacoEditor.defaultProps = {
  width: '100%',
  height: '100%',
  value: null,
  defaultValue: '',
  language: 'javascript',
  theme: 'vs',
  options: {},
  editorDidMount: noop,
  editorWillMount: noop,
  onChange: noop,
  requireConfig: {},
};

export default MonacoEditor;
