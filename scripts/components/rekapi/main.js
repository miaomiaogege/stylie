import _ from 'underscore';
import Lateralus from 'lateralus';
import Rekapi from 'rekapi';
import ActorModel from './models/actor';
import AEnimaRekapiComponent from 'aenima/components/rekapi/main';

const Base = AEnimaRekapiComponent;
const baseProto = Base.prototype;

const RekapiComponent = Base.extend({
  name: 'stylie-rekapi',

  ActorModel: ActorModel,

  provide: _.defaults(
    {
      /**
       * @return {Object}
       */
      timelineExport: function() {
        return this.applyOrientationToExport(
          baseProto.provide.timelineExport.bind(this)
        );
      },

      /**
       * @param {Object} cssOpts Gets passed to Rekapi.DOMRenderer#toString.
       * @return {string}
       */
      cssAnimationString: function(cssOpts) {
        return this.applyOrientationToExport(
          baseProto.provide.cssAnimationString.bind(this, cssOpts)
        );
      },

      /**
       * TODO: Perhaps this can be provided from the ActorModel class itself?
       * @return {ActorModel}
       */
      currentActorModel: function() {
        return this.actorModel;
      },
    },
    baseProto.provide
  ),

  lateralusEvents: {
    /**
     * @param {KeyboardEvent} evt
     */
    userRequestUndo: function(evt) {
      // Prevent focusing of the previously-modified input element
      evt.preventDefault();

      this.revertToPreviouslyRecordedUndoState();
    },
  },

  initialize: function() {
    baseProto.initialize.apply(this, arguments);
    this.setupActor();
  },

  /**
   * @param {Function} exportProcessor
   * @return {*}
   */
  applyOrientationToExport: function(exportProcessor) {
    const needToAccountForOffset =
      this.lateralus.model.getUi('exportOrientation') === 'first-keyframe';

    const offset = this.actorModel.getFirstKeyframeOffset();

    if (needToAccountForOffset) {
      this.actorModel.prepareForExport(offset);
    }

    const exportedAnimation = exportProcessor.call(this);

    if (needToAccountForOffset) {
      this.actorModel.cleanupAfterExport(offset);
    }

    return exportedAnimation;
  },

  /**
   * @return {Object}
   */
  toJSON: function() {
    return {
      actorModel: this.actorModel.toJSON(),
      curves: this.curves,
    };
  },

  /**
   * @return {Object}
   */
  exportTimelineForMantra: function() {
    const exportRekapi = new Rekapi();
    exportRekapi.addActor(this.actorModel.exportForMantra());

    return exportRekapi.exportTimeline();
  },

  /**
   * @param {Object} animationData
   */
  fromJSON: function(animationData) {
    this.lateralus.model.set('isLoadingTimeline', true, { silent: true });

    // TODO: The requestClearTimeline event should be emitted from
    // clearCurrentAnimation (AEnima method).  That method is currently being
    // utilized by Mantra in a slightly different way and might need some
    // refactoring before requestClearTimeline can be moved into it.
    this.emit('requestClearTimeline');
    this.clearCurrentAnimation();

    this.emit('loadBezierCurves', animationData.curves);

    this.actorModel.setKeyframes(
      animationData.actorModel.transformPropertyCollection
    );

    this.lateralus.model.set('isLoadingTimeline', false, { silent: true });
    this.doTimelineUpdate();
  },

  /**
   * @override
   */
  revertToPreviouslyRecordedUndoState: function() {
    this.emit('userRequestDeselectAllKeyframes');
    baseProto.revertToPreviouslyRecordedUndoState.apply(this, arguments);
  },
});

export default RekapiComponent;
