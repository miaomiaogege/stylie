define([

  'underscore'
  ,'backbone'

  ,'src/constants'

], function (

  _
  ,Backbone

  ,constant

) {
  var KeyframeModel = Backbone.Model.extend({

    /**
     * @param {Object} attrs
     * @param {ActorModel} actorModel
     */
    initialize: function (attrs, opts) {
      this.stylie = this.collection.stylie;
      this.actorModel = opts.actorModel;

      // TODO: This message subscription and event binding should be
      // consolidated into one operation.
      var updateInternally = _.bind(this.updateInternally, this);
      this.listenTo(
        this.actorModel, 'change:isCenteredToPath', updateInternally);
      this.on('change', updateInternally);
    }

    ,validate: function (attrs) {
      var foundNaN = false;
      _.each(attrs, function (attr) {
        if (typeof attr !== 'number') {
          foundNaN = true;
        }
      });

      if (foundNaN) {
        return 'Number is NaN';
      }
    }

    ,updateInternally: function () {
      this.actorModel.modifyKeyframe(
          this.attributes.millisecond, this.getCSS(),
          { transform: this.attributes.easing });
    }

    /**
     * @param {number} toMillisecond
     */
    ,moveTo: function (toMillisecond) {
      this.actorModel.moveKeyframe(this.attributes.millisecond, toMillisecond);
    }

    ,destroy: function () {
      this.trigger('destroy');
      this.stopListening();
      this.off();
    }

    ,getEasingObject: function () {
      var easingChunks = this.get('easing').split(' ');
      return {
        x: easingChunks[0]
        ,y: easingChunks[1]
        ,rX: easingChunks[2]
        ,rY: easingChunks[3]
        ,rZ: easingChunks[4]
      };
    }

    ,getCSS: function () {
      var attributes = this.attributes;

      return KeyframeModel.createCSSRuleObject(
          attributes.x
          ,attributes.y
          ,attributes.rX
          ,attributes.rY
          ,attributes.rZ
          ,this.actorModel.get('isCenteredToPath'));
    }

    ,getAttrs: function () {
      return {
        x: this.get('x')
        ,y: this.get('y')
        ,rX: this.get('rX')
        ,rY: this.get('rY')
        ,rZ: this.get('rZ')
      };
    }
  }, {

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} rX
     * @param {number} rY
     * @param {number} rZ
     * @param {boolean} isCentered
     */
    createCSSRuleObject: function (x, y, rX, rY, rZ, isCentered) {
      return {
        transform:
          ['translate(', x ,'px, ', y
            ,'px) rotateX(', rX
            ,'deg) rotateY(', rY
            ,'deg) rotateZ(', rZ
            ,isCentered
              ? 'deg) translate(-50%, -50%)'
              : 'deg)'
            ].join('')
      };
    }
  });

  return KeyframeModel;
});
