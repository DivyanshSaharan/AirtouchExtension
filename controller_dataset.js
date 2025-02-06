class ControllerDataset {
  constructor() {
    this.labels = []
  }

  /**
   * Adds an example to the controller dataset.
   * @param {Tensor} example A tensor representing the example. It can be an
   *     image, an activation, or any other type of Tensor.
   * @param {number} label The label of the example. Should be a number.
   */
  addExample(example, label) {
    // One-hot encode the label.
    const y = label;

    if (this.xs == null) {

      this.xs = tf.keep(example);
      this.labels.push(labelsCaptured.indexOf(y));
    } else {
      const oldX = this.xs;
      this.xs = tf.keep(oldX.concat(example, 0));
      this.labels.push(labelsCaptured.indexOf(y));

      oldX.dispose();
    }
  }
  addLabels(numClasses) {
    for (var i = 0; i < this.labels.length; i++) {
      if (this.ys == null) {
        this.ys = tf.keep(tf.tidy(
            () => {return tf.oneHot(
                tf.tensor1d([this.labels[i]]).toInt(), numClasses)}));
      } else {
        const y = tf.tidy(
            () => {return tf.oneHot(
                tf.tensor1d([this.labels[i]]).toInt(), numClasses)});
        const oldY = this.ys;
        this.ys = tf.keep(oldY.concat(y, 0));
        oldY.dispose();
        y.dispose();
      }
    }
  }
}
