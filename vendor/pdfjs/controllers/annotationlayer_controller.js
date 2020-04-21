PDFJS.Reader.AnnotationLayerController = function (options, reader) {

    this.reader = reader;
    this.annotationDiv = options.annotationDiv;
    this.pdfPage = options.pdfPage;
    this.renderInteractiveForms = options.renderInteractiveForms;
    this.linkService = options.linkService;
    this.downloadManager = options.downloadManager;

    this.div = null;

    return this;
};

PDFJS.Reader.AnnotationLayerController.prototype.render = function (viewport, intent) {
	var self = this;
	var parameters = {
		intent: (intent === undefined ? 'display' : intent),
	};

	this.pdfPage.getAnnotations(parameters).then(function (annotations) {
		viewport = viewport.clone({ dontFlip: true });
		parameters = {
			viewport: viewport,
			div: self.div,
			annotations: annotations,
			page: self.pdfPage,
			renderInteractiveForms: self.renderInteractiveForms,
			linkService: self.linkService,
			downloadManager: self.downloadManager,
		};

		if (self.div) {
			// If an annotationLayer already exists, refresh its children's
			// transformation matrices.
			PDFJS.AnnotationLayer.update(parameters);
		} else {
			// Create an annotation layer div and render the annotations
			// if there is at least one annotation.
			if (annotations.length === 0) {
				return;
			} 

            self.div = self.annotationDiv;
			parameters.div = self.div;

			PDFJS.AnnotationLayer.render(parameters);
		}
	});
};

PDFJS.Reader.AnnotationLayerController.prototype.hide = function () {

    if (!this.div) {
        return;
    }

    this.div.setAttribute('hidden', 'true');
};
