/**
 * @typedef {Object} StyleDefinition
 * @property {string} css - CSS style string for console styling
 * @property {string} [description] - Description of what this style represents
 */

/**
 * @typedef {Object} StyleOptions
 * @property {string} [background] - Background color
 * @property {string} [color] - Text color
 * @property {string} [fontSize] - Font size (e.g., '16px')
 * @property {string} [fontWeight] - Font weight (e.g., 'bold')
 * @property {string} [padding] - Padding (e.g., '2px 5px')
 * @property {string} [margin] - Margin
 * @property {string} [border] - Border
 * @property {string} [borderRadius] - Border radius
 * @property {string} [textDecoration] - Text decoration
 * @property {string} [textTransform] - Text transformation
 * @property {string} [fontStyle] - Font style (e.g., 'italic')
 * @property {Object.<string, string>} [custom] - Any custom CSS properties
 */

/**
 * @typedef {Object} LogStyle
 * @property {string} style - Style key to apply
 * @property {*} value - Value to display with this style
 */

/**
 * @typedef {Object} DebugServiceOptions
 * @property {string} [cookieName='bEnableReserch'] - Name of the debug cookie
 * @property {Object.<string, StyleDefinition|StyleOptions>} [styles] - Custom styles
 * @property {Function} [getCookie] - Custom cookie getter function
 * @property {Function} [setCookie] - Custom cookie setter function
 * @property {string} [toggleKey='{'] - Key to use with Ctrl+Shift for toggling debug mode
 * @property {boolean} [enableKeyboardToggle=true] - Whether to enable keyboard toggle
 * @property {string} [theme='light'] - Default theme ('light' or 'dark')
 */

/**
 * ConsoleDebugService - Enhanced console debugging with dynamic styling
 */
class ConsoleDebugService {
  /**
   * Creates a new instance of the ConsoleDebugService
   * @param {DebugServiceOptions} options - Configuration options
   */
  constructor(options = {}) {
    // Cookie name for debug mode toggle
    this.debugCookieName = options.cookieName || 'bEnableReserch';
    
    // Theme setup
    this.theme = options.theme || 'light';
    
    // Initialize style system
    this._initializeStyleSystem(options.styles);
    
    // Setup cookie handlers
    this.getCookie = options.getCookie || this._defaultGetCookie.bind(this);
    this.setCookie = options.setCookie || this._defaultSetCookie.bind(this);
    
    // Setup keyboard toggle
    if (options.enableKeyboardToggle !== false) {
      this._setupKeyboardToggle(options.toggleKey || '{');
    }
  }
  
  /**
   * Initializes the style system with defaults and custom styles
   * @private
   * @param {Object.<string, StyleDefinition|StyleOptions>} [customStyles] - Custom styles
   */
  _initializeStyleSystem(customStyles = {}) {
    // Create style registry
    this.styles = {};
    
    // Add default styles
    this.addStyle('error', { background: 'LightCoral', color: 'white', description: 'Error highlight' });
    this.addStyle('success', { background: 'LightGreen', color: 'black', description: 'Success highlight' });
    this.addStyle('info', { background: 'LightSkyBlue', color: 'black', description: 'Info highlight' });
    this.addStyle('warning', { background: 'LightYellow', color: 'black', description: 'Warning highlight' });
    this.addStyle('debug', { background: 'LightPink', color: 'black', description: 'Debug highlight' });
    this.addStyle('important', { background: 'Salmon', color: 'black', description: 'Important highlight' });
    this.addStyle('large', { 
      background: 'yellow', 
      color: 'black', 
      fontSize: '20px', 
      fontWeight: 'bold', 
      description: 'Large text'
    });
    
    // Add color shortcuts (backwards compatibility)
    this.addStyle('red', this.styles.error);
    this.addStyle('green', this.styles.success);
    this.addStyle('blue', this.styles.info);
    this.addStyle('yellow', this.styles.warning);
    this.addStyle('pink', this.styles.debug);
    this.addStyle('orange', this.styles.important);
    
    // Add custom styles
    Object.entries(customStyles || {}).forEach(([name, style]) => {
      this.addStyle(name, style);
    });
    
    // Create style helper methods
    this._createStyleHelpers();
  }
  
  /**
   * Creates a CSS string from style options
   * @private
   * @param {StyleOptions|string} options - Style options or CSS string
   * @returns {string} CSS string
   */
  _createCssFromOptions(options) {
    // If it's already a string, return it
    if (typeof options === 'string') return options;
    
    // If it already has a css property, use that
    if (options.css) return options.css;
    
    // Build CSS from options
    const cssProperties = [];
    
    if (options.background) cssProperties.push(`background: ${options.background}`);
    if (options.color) cssProperties.push(`color: ${options.color}`);
    if (options.fontSize) cssProperties.push(`font-size: ${options.fontSize}`);
    if (options.fontWeight) cssProperties.push(`font-weight: ${options.fontWeight}`);
    if (options.padding) cssProperties.push(`padding: ${options.padding}`);
    if (options.margin) cssProperties.push(`margin: ${options.margin}`);
    if (options.border) cssProperties.push(`border: ${options.border}`);
    if (options.borderRadius) cssProperties.push(`border-radius: ${options.borderRadius}`);
    if (options.textDecoration) cssProperties.push(`text-decoration: ${options.textDecoration}`);
    if (options.textTransform) cssProperties.push(`text-transform: ${options.textTransform}`);
    if (options.fontStyle) cssProperties.push(`font-style: ${options.fontStyle}`);
    
    // Add any custom properties
    if (options.custom) {
      Object.entries(options.custom).forEach(([prop, value]) => {
        const cssProperty = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        cssProperties.push(`${cssProperty}: ${value}`);
      });
    }
    
    return cssProperties.join('; ');
  }
  
  /**
   * Creates style helper methods
   * @private
   */
  _createStyleHelpers() {
    // Create a styles container
    this.s = {};
    
    // For each defined style, create a method
    Object.keys(this.styles).forEach(styleName => {
      // Create method like s.error(), s.success(), etc.
      this.s[styleName] = (value) => {
        return { style: styleName, value: value };
      };
    });
    
    // Add a dynamic style creator method
    this.s.custom = (cssOptions, value) => {
      // Generate a unique style ID
      const styleId = `dynamic_${Object.keys(this.styles).length}`;
      
      // Add this style to the registry
      this.addStyle(styleId, cssOptions);
      
      // Return the styled value
      return { style: styleId, value: value };
    };
  }
  
  /**
   * Add a new style to the registry
   * @public
   * @param {string} name - Name of the style
   * @param {StyleOptions|StyleDefinition|string} style - Style definition
   * @returns {ConsoleDebugService} This instance for chaining
   */
  addStyle(name, style) {
    // Convert to standard style definition
    let styleDefinition;
    
    if (typeof style === 'string') {
      // It's a CSS string
      styleDefinition = { css: style };
    } else if (style.css) {
      // It's already a style definition
      styleDefinition = { ...style };
    } else {
      // It's style options
      styleDefinition = {
        css: this._createCssFromOptions(style),
        description: style.description || `Style: ${name}`
      };
    }
    
    // Add to styles registry
    this.styles[name] = styleDefinition;
    
    // Add helper method if it doesn't exist
    if (this.s && !this.s[name]) {
      this.s[name] = (value) => {
        return { style: name, value: value };
      };
    }
    
    return this;
  }
  
  /**
   * Set the theme and update styles accordingly
   * @public
   * @param {'light'|'dark'|string} theme - Theme name
   * @returns {ConsoleDebugService} This instance for chaining
   */
  setTheme(theme) {
    this.theme = theme;
    
    // Update styles based on theme
    if (theme === 'dark') {
      // Adjust colors for dark theme
      this.addStyle('error', { background: '#F44336', color: 'white', description: 'Error highlight' });
      this.addStyle('success', { background: '#4CAF50', color: 'white', description: 'Success highlight' });
      this.addStyle('info', { background: '#2196F3', color: 'white', description: 'Info highlight' });
      this.addStyle('warning', { background: '#FFC107', color: 'black', description: 'Warning highlight' });
      this.addStyle('debug', { background: '#E91E63', color: 'white', description: 'Debug highlight' });
      this.addStyle('important', { background: '#FF5722', color: 'white', description: 'Important highlight' });
    } else if (theme === 'light') {
      // Reset to light theme
      this.addStyle('error', { background: 'LightCoral', color: 'white', description: 'Error highlight' });
      this.addStyle('success', { background: 'LightGreen', color: 'black', description: 'Success highlight' });
      this.addStyle('info', { background: 'LightSkyBlue', color: 'black', description: 'Info highlight' });
      this.addStyle('warning', { background: 'LightYellow', color: 'black', description: 'Warning highlight' });
      this.addStyle('debug', { background: 'LightPink', color: 'black', description: 'Debug highlight' });
      this.addStyle('important', { background: 'Salmon', color: 'black', description: 'Important highlight' });
    }
    
    // Update color aliases
    this.addStyle('red', this.styles.error);
    this.addStyle('green', this.styles.success);
    this.addStyle('blue', this.styles.info);
    this.addStyle('yellow', this.styles.warning);
    this.addStyle('pink', this.styles.debug);
    this.addStyle('orange', this.styles.important);
    
    return this;
  }
  
  /**
   * Default cookie getter implementation
   * @private
   * @param {string} name - Cookie name
   * @returns {string} Cookie value
   */
  _defaultGetCookie(name) {
    if (typeof document === 'undefined') return '';
    
    const match = document.cookie.match(new RegExp(`(^|;\\s*)(${name})=([^;]*)`));
    return match ? decodeURIComponent(match[3]) : '';
  }
  
  /**
   * Default cookie setter implementation
   * @private
   * @param {string} name - Cookie name
   * @param {string} value - Cookie value
   * @param {Object} options - Cookie options
   */
  _defaultSetCookie(name, value, options = {}) {
    if (typeof document === 'undefined') return;
    
    const path = options.path || '/';
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=${path}`;
  }
  
  /**
   * Setup keyboard toggle for debug mode
   * @private
   * @param {string} toggleKey - Key to use with Ctrl+Shift
   */
  _setupKeyboardToggle(toggleKey) {
    if (typeof window === 'undefined') return;
    
    const handler = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === toggleKey) {
        this.toggleDebugMode();
      }
    };
    
    window.addEventListener('keydown', handler);
    this._keyboardHandler = handler;
  }
  
  /**
   * Remove keyboard event listener
   * @public
   */
  removeKeyboardListener() {
    if (typeof window !== 'undefined' && this._keyboardHandler) {
      window.removeEventListener('keydown', this._keyboardHandler);
    }
  }
  
  /**
   * Check if debug mode is enabled
   * @public
   * @returns {boolean} True if debug mode is enabled
   */
  isDebugModeEnabled() {
    return this.getCookie(this.debugCookieName) === 'true';
  }
  
  /**
   * Toggle debug mode on/off
   * @public
   * @returns {boolean} New debug mode state
   */
  toggleDebugMode() {
    const newState = !this.isDebugModeEnabled();
    this.setCookie(this.debugCookieName, String(newState), { path: '/' });
    
    if (newState) {
      console.log('%cDebug Mode Enabled', this.styles.success.css);
    } else {
      console.log('%cDebug Mode Disabled', this.styles.error.css);
    }
    
    return newState;
  }
  
  /**
   * Log message if debug mode is enabled
   * @public
   * @param {...*} args - Arguments to log
   */
  log(...args) {
    if (this.isDebugModeEnabled()) {
      console.log(...args);
    }
  }
  
  /**
   * Log error if debug mode is enabled
   * @public
   * @param {...*} args - Arguments to log
   */
  error(...args) {
    if (this.isDebugModeEnabled()) {
      console.error(...args);
    }
  }
  
  /**
   * Log warning if debug mode is enabled
   * @public
   * @param {...*} args - Arguments to log
   */
  warn(...args) {
    if (this.isDebugModeEnabled()) {
      console.warn(...args);
    }
  }
  
  /**
   * Log data as table if debug mode is enabled
   * @public
   * @param {*} data - Data to display as table
   * @param {Array<string>} [columns] - Optional columns to include
   */
  table(data, columns) {
    if (this.isDebugModeEnabled()) {
      if (columns) {
        console.table(data, columns);
      } else {
        console.table(data);
      }
    }
  }
  
  /**
   * Time execution of a function if debug mode is enabled
   * @public
   * @param {string} label - Timer label
   * @param {Function} fn - Function to time
   * @param {...*} args - Arguments to pass to the function
   * @returns {*} Function result
   */
  time(label, fn, ...args) {
    if (!this.isDebugModeEnabled()) {
      return fn(...args);
    }
    
    console.time(label);
    try {
      const result = fn(...args);
      console.timeEnd(label);
      return result;
    } catch (error) {
      console.timeEnd(label);
      throw error;
    }
  }
  
  /**
   * Create a group of logs if debug mode is enabled
   * @public
   * @param {string} label - Group label
   * @param {Function} fn - Function containing logs
   * @param {boolean} [collapsed=false] - Whether group should be collapsed
   */
  group(label, fn, collapsed = false) {
    if (!this.isDebugModeEnabled()) return;
    
    if (collapsed) {
      console.groupCollapsed(label);
    } else {
      console.group(label);
    }
    
    try {
      fn();
    } finally {
      console.groupEnd();
    }
  }
  
  /**
   * Format a styled console message
   * @public
   * @param {string[]} strings - Template literal strings
   * @param {...(LogStyle|*)} values - Values to interpolate
   * @returns {[string, ...string[]]} Formatted message with style arguments
   */
  format(strings, ...values) {
    let result = '';
    const styles = [];
    
    // Process each part of the template
    strings.forEach((str, i) => {
      // Add the string part
      result += str;
      
      // Process the value if there is one
      if (i < values.length) {
        const value = values[i];
        
        // Check if this is a styled value
        if (value && typeof value === 'object' && 'style' in value && 'value' in value) {
          // It's a styled value
          const styleObj = this.styles[value.style] || { css: '' };
          result += '%c' + value.value + '%c';
          styles.push(styleObj.css, '');
        } else {
          // Regular value
          result += value;
        }
      }
    });
    
    return [result, ...styles];
  }
  
  /**
   * Log a styled message if debug mode is enabled
   * @public
   * @param {string[]} strings - Template literal strings
   * @param {...(LogStyle|*)} values - Values to interpolate
   */
  styled(strings, ...values) {
    if (this.isDebugModeEnabled()) {
      const formatted = this.format(strings, ...values);
      console.log(...formatted);
    }
  }
  
  /**
   * Create a custom style dynamically and apply it
   * @public
   * @param {StyleOptions} styleOptions - Style options
   * @returns {Function} Function that accepts a value and returns a styled object
   */
  style(styleOptions) {
    return (value) => this.s.custom(styleOptions, value);
  }
  
  /**
   * Print available styles and usage help
   * @public
   */
  help() {
    if (!this.isDebugModeEnabled()) {
      console.log('Debug mode is disabled. Enable it to see more information.');
      return;
    }
    
    console.group('ConsoleDebugService Help');
    
    console.log(`Current theme: ${this.theme}`);
    console.log('Debug mode is enabled.');
    
    console.group('Available styles:');
    Object.entries(this.styles).forEach(([name, style]) => {
      if (!name.startsWith('dynamic_')) {
        console.log(`%c${name}%c - ${style.description || 'No description'}`, 
          style.css, '');
      }
    });
    console.groupEnd();
    
    console.log('\nUsage examples:');
    console.log(`debug.styled\`Status: \${debug.s.success('Success')} - Count: \${debug.s.info(500)}\``);
    console.log(`debug.styled\`Custom style: \${debug.style({ background: 'purple', color: 'white' })('Dynamic')}\``);
    
    console.groupEnd();
  }
}

/**
 * Create and configure a debug service instance
 * @param {DebugServiceOptions} [options] - Configuration options
 * @returns {ConsoleDebugService} Configured debug service
 */
export function createDebugService(options = {}) {
  return new ConsoleDebugService(options);
}

/**
 * Default debug service instance
 * @type {ConsoleDebugService}
 */
export const debug = createDebugService();

export default ConsoleDebugService;