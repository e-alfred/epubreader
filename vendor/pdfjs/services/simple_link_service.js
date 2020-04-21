PDFJS.Reader.SimpleLinkService = function () {

    return this;
};

Object.defineProperties(PDFJS.Reader.SimpleLinkService, {
    'page': {
        get: function () { return 0; },
        set: function(value) {}
    }
});

PDFJS.Reader.SimpleLinkService.prototype.navigateTo = function (destUrl) {
};

PDFJS.Reader.SimpleLinkService.prototype.getDestinationHash = function (destination) {
	return "#";
};

PDFJS.Reader.SimpleLinkService.prototype.getAnchorUrl = function (anchor) {
	return "#";
};

PDFJS.Reader.SimpleLinkService.prototype.setHash = function (hash) {
};

PDFJS.Reader.SimpleLinkService.prototype.executeNamedAction = function (action) {
};

PDFJS.Reader.SimpleLinkService.prototype.onFileAttachmentAnnotation = function (params) {
};

PDFJS.Reader.SimpleLinkService.prototype.cachePageRef = function (pageNum, pageRef) {
};
