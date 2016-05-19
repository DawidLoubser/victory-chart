import { merge, defaults, partial, omit, isFunction } from "lodash";

export default {
  getPartialEvents(events, eventKey, childProps) {
    return events ?
      Object.keys(events).reduce((memo, eventName) => {
        /* eslint max-params: 0 */
        memo[eventName] = partial(
          events[eventName],
          partial.placeholder, // evt will still be the first argument for event handlers
          childProps, // event handlers will have access to data component props, including data
          eventKey, // used in setting a unique state property
          eventName // used in setting a unique state property
        );
        return memo;
      }, {}) :
      {};
  },

  /*
  [
    {
      target: "data",
      eventKey: 1,
      mutation: {
        style: {fill: "red"},
        symbol: "triangle"
      }
    },
    {
      target: "labels",
      eventKey: 2,
      text: "hello"
    }
  ]
  */

  getEvents(events, namespace) {
    const parseEvent = (props, childProps, eventKey) => {
      const key = props.eventKey || eventKey;
      const target = props.target || namespace;
      const propKeys = Object.keys(props).filter(
        (prop) => prop !== "target" && prop !== "eventKey"
      );
      const mergedProps = propKeys.reduce((memo, propKey) => {
        memo[propKey] = defaults({}, props[propKey], childProps[propKey]);
        return memo;
      }, {});
      return {[key]: {[target]: mergedProps}}
    };

    const parseEventReturn = (newProps, childProps, eventKey) => {
      return Array.isArray(newProps) ?
        newProps.reduce((memo, props) => {
          memo = merge({}, memo, parseEvent(props, childProps, eventKey));
          return memo;
        }, {}) :
        parseEvent(newProps, childProps, eventKey);
    };

    const onEvent = (evt, childProps, eventKey, eventName) => {
      if (this.props.events[namespace] && this.props.events[namespace][eventName]) {
        const newProps = this.props.events[namespace][eventName](evt, childProps, eventKey);
        this.setState(parseEventReturn(newProps, childProps, eventKey));
      }
    };

    return events ?
      Object.keys(this.props.events[namespace]).reduce((memo, event) => {
        memo[event] = onEvent;
        return memo;
      }, {}) : {};
  },

  getEventState(eventKey, namespace) {
    return this.state[eventKey] && this.state[eventKey][namespace];
  },

  getEventKey(key) {
    // creates a data accessor function
    // given a property key, path, array index, or null for identity.
    if (isFunction(key)) {
      return key;
    } else if (key === null || typeof key === "undefined") {
      return () => undefined;
    }
    // otherwise, assume it is an array index, property key or path (_.property handles all three)
    return property(key);
  }
};
