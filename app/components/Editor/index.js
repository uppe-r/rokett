import React, { PropTypes } from 'react'

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
    console.log("1");
    let amdRequire = global.require('monaco-editor/min/vs/loader.js').require;
    amdRequire.config({
      baseUrl: 'node_modules/monaco-editor/min/'
    });

    // workaround monaco-css not understanding the environment
    self.module = undefined;
    // workaround monaco-typescript not understanding the environment
    self.process.browser = true;
    var editor;
    amdRequire(['vs/editor/editor.main'], () => {
      this.initMonaco();
      /* editor = monaco.editor.create(document.getElementById(id), {
        value: "ee",
        language: 'javascript',
        theme: "vs-dark",
      }); */
      window.addEventListener('resize', () => {
        if (id === this.props.activeTab) {
          let editorNode = document.getElementById(id);
          let parent = editorNode.parentElement;
          editorNode.style.width = parent.clientWidth;
          editorNode.firstElementChild.style.width = parent.clientWidth;
          editorNode.firstElementChild.firstElementChild.style.width = parent.clientWidth;
          editorNode.getElementsByClassName('monaco-scrollable-element')[0].style.width = parent.clientWidth - 46;
        }
      })
    });
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
      <div ref="container" style={style} className="react-monaco-editor-container"></div>
    )
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