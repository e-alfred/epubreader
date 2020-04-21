PDFJS.reader.NotesController = function(book) {

    var book = this.book,
        reader = this,
        eventBus = this.eventBus,
        $notesView = $("#notesView"),
        $notes = $("#notes"),
        $text = $("#note-text"),
        $anchor = $("#note-anchor"),
        $next = $("#next"),
        $prev = $("#prev"),
        $touch_nav = $("#touch_nav"),
        $viewer = $("#viewer"),
        annotations = reader.settings.annotations,
        renderer = book.renderer,
        popups = [];

    var show = function() {
        $notesView.addClass('open');
        $text.focus();
    };

    var hide = function() {
        $notesView.removeClass('open');
    };

    $text.on("keydown", function(e) {
        e.stopPropagation();
    });

    var insertAtPoint = function(e) {
        var range,
            textNode,
            offset,
            doc = document,
            loc,
            annotation;

        // standard
        if (doc.caretPositionFromPoint) {
            range = doc.caretPositionFromPoint(e.clientX, e.clientY);
            textNode = range.offsetNode;
            offset = range.offset;
        // WebKit
        } else if (doc.caretRangeFromPoint) {
            range = doc.caretRangeFromPoint(e.clientX, e.clientY);
            textNode = range.startContainer;
            offset = range.startOffset;
        }

        console.log("textNode", textNode, "offset", offset);
        console.log(e);

        if (textNode.nodeType !== 3) {
            for (var i=0; i < textNode.childNodes.length; i++) {
                if (textNode.childNodes[i].nodeType == 3) {
                    textNode = textNode.childNodes[i];
                    break;
                }
            }
        }

        // Find the end of the sentence
        offset = textNode.textContent.indexOf(".", offset);
        if(offset === -1){
            offset = textNode.length; // Last item
        } else {
            offset += 1; // After the period
        }

        loc = "";

        annotation = new reader.Annotation('annotation', loc, $text.val());

        // save...
        reader.addAnnotation(annotation);

        // show...
        addAnnotationItem(annotation);
        // add marker...
        placeMarker(annotation);

        // clear entry
        $text.val('');
        $anchor.removeClass("icon-location_off");
        $anchor.addClass("icon-room");
        $text.prop("disabled", false);

        book.off("renderer:click", insertAtPoint);
    };

    var addAnnotationItem = function(annotation) {
        $notes.append(createItem(annotation));
        //reader.settings.session.setBookmark(annotation.id, annotation.anchor, annotation.type, annotation);
    };

    var removeAnnotation = function (id) {

        if (annotations[id] !== undefined) {
            if (annotations[id].type == "bookmark")
                eventBus.dispatch("bookmarkremoved", {
                    source: this,
                    id: id
                });
            deleteAnnotationItem(id);
            delete annotations[id];
            reader.settings.session.deleteBookmark(id);
        }
    };

    var deleteAnnotationItem = function (id) {
        var item = document.getElementById(id);

        if (item)
            item.remove();
    };

    /* items are HTML-representations of annotations */
        var createItem = function(annotation){
            var item = document.createElement("li");
            var text = document.createElement("div");
            var date = document.createElement("div");
            var edit = document.createElement("span");
            var del = document.createElement("span");
            var link = document.createElement("a");
            var div = document.createElement("div");
            var save = document.createElement("span");
            var cancel = document.createElement("span");

            text.textContent = annotation.body;
            date.textContent = new Date(annotation.edited).toUTCString();
            item.classList.add("note");
            del.classList.add("item-delete", "item-control", "icon-delete");
            edit.classList.add("item-edit", "item-control", "icon-rate_review");
            link.classList.add("note-link");
            //link.classList.add("note-link", "icon-link2");
            date.classList.add("item-date");
            del.setAttribute("title",  "delete");
            edit.setAttribute("title", "edit");
            link.setAttribute("title", "context");
            item.setAttribute("id", annotation.id);
            save.classList.add("item-save", "edit-control", "hide", "icon-check");
            cancel.classList.add("item-cancel", "edit-control", "hide", "icon-close");
            save.setAttribute("display", "none");
            cancel.setAttribute("display", "none");

            link.href = "#"+annotation.anchor;
            link.textContent = "Page " + annotation.anchor;

            link.onclick = function(){
                reader.queuePage(annotation.anchor);
                return false;
            };


            if (!annotation.readonly) {
                del.onclick = function() {
                    var id = this.parentNode.parentNode.getAttribute("id");
                    deleteAnnotationItem(id);
                    reader.removeAnnotation(id);
                };

                save.onclick = function() {
                    var id = this.parentNode.parentNode.getAttribute("id");
                    var annotation = annotations[id];
                    var text = this.parentNode.parentNode.firstChild;
                    try {
                        annotation.body = text.textContent;
                        reader.updateAnnotation(annotation);
                    } catch (e) {
                        console.log("Updating annotation failed: " + e);
                    }
                    closeEditor(id);
                };

                cancel.onclick = function () {
                    var id = this.parentNode.parentNode.getAttribute("id");
                    var text = this.parentNode.parentNode.firstChild;
                    text.textContent = annotations[id].body;
                    closeEditor(id);
                };

                edit.onclick = function() {
                    openEditor(this.parentNode.parentNode.getAttribute("id"));
                };

                div.appendChild(cancel);
                div.appendChild(save);
                div.appendChild(del);
                div.appendChild(edit);
            }

            div.appendChild(link);
            item.appendChild(text);
            if (!annotation.readonly)
                item.appendChild(date);
            item.appendChild(div);
            return item;
        };

    var editAnnotation = function (e) {
        var text = e.target;
        var id = text.parentNode.getAttribute("id");
        if (e.keyCode === 27) { // escape - cancel editor, discard changes
            text.textContent = annotations[id].body;
            closeEditor(id);
        }
        e.stopPropagation();
    };

    var openEditor = function(id) {
        var item = document.getElementById(id);
        var text = item.firstChild;
        $(item).find(".item-control").toggleClass("hide");
        $(item).find(".edit-control").toggleClass("hide");
        text.setAttribute("contenteditable", "true");
        text.classList.add("editable");
        text.addEventListener("keydown", editAnnotation, false);
    };

    var closeEditor = function (id) {
        var item = document.getElementById(id);
        var text = item.firstChild;
        $(item).find(".item-control").toggleClass("hide");
        $(item).find(".edit-control").toggleClass("hide");
        text.classList.remove("editable");
        text.removeAttribute("contenteditable");
        text.removeEventListener("keydown", editAnnotation, false);
    };

    var findIndex = function (id) {
        // list has items
        var i,
            list = $notes[0].getElementsByTagName("li");

        for (i = 0; i < list.length; i++) {
            if (list[i].getAttribute("id") === id)
                break;
        }

        return i+1;
    };

    var placeMarker = function(annotation){
        var doc = book.renderer.doc,
            marker = document.createElement("span"),
            mark = document.createElement("a");

        marker.classList.add("note-marker", "footnotesuperscript", "reader_generated");
        marker.id = "note-" + annotation.id;
        mark.innerHTML = findIndex(annotation.id) + "[Reader]";

        marker.appendChild(mark);
        // epubcfi.addMarker(annotation.anchor, doc, marker);

        markerEvents(marker, annotation.body);
        renumberMarkers();
    }

    var markerEvents = function(item, txt){
        var id = item.id;

        var showPop = function(){
            var poppos,
                iheight = renderer.height,
                iwidth = renderer.width,
                tip,
                pop,
                maxHeight = 225,
                itemRect,
                left,
                top,
                pos;


            //-- create a popup with endnote inside of it
            if(!popups[id]) {
                popups[id] = document.createElement("div");
                popups[id].setAttribute("class", "popup");

                pop_content = document.createElement("div"); 

                popups[id].appendChild(pop_content);

                pop_content.innerHTML = txt;
                pop_content.setAttribute("class", "pop_content");

                renderer.render.document.body.appendChild(popups[id]);

                //-- TODO: will these leak memory? - Fred 
                popups[id].addEventListener("mouseover", onPop, false);
                popups[id].addEventListener("mouseout", offPop, false);

                //-- Add hide on page change
                renderer.on("renderer:locationChanged", hidePop, this);
                renderer.on("renderer:locationChanged", offPop, this);
                // chapter.book.on("renderer:chapterDestroy", hidePop, this);
            }

            pop = popups[id];


            //-- get location of item
            itemRect = item.getBoundingClientRect();
            left = itemRect.left;
            top = itemRect.top;

            //-- show the popup
            pop.classList.add("show");

            //-- locations of popup
            popRect = pop.getBoundingClientRect();

            //-- position the popup
            pop.style.left = left - popRect.width / 2 + "px";
            pop.style.top = top + "px";


            //-- Adjust max height
            if(maxHeight > iheight / 2.5) {
                maxHeight = iheight / 2.5;
                pop_content.style.maxHeight = maxHeight + "px";
            }

            //-- switch above / below
            if(popRect.height + top >= iheight - 25) {
                pop.style.top = top - popRect.height  + "px";
                pop.classList.add("above");
            }else{
                pop.classList.remove("above");
            }

            //-- switch left
            if(left - popRect.width <= 0) {
                pop.style.left = left + "px";
                pop.classList.add("left");
            }else{
                pop.classList.remove("left");
            }

            //-- switch right
            if(left + popRect.width / 2 >= iwidth) {
                //-- TEMP MOVE: 300
                pop.style.left = left - 300 + "px";

                popRect = pop.getBoundingClientRect();
                pop.style.left = left - popRect.width + "px";
                //-- switch above / below again
                if(popRect.height + top >= iheight - 25) { 
                    pop.style.top = top - popRect.height  + "px";
                    pop.classList.add("above");
                }else{
                    pop.classList.remove("above");
                }

                pop.classList.add("right");
            }else{
                pop.classList.remove("right");
            }

        }

        var onPop = function(){
            popups[id].classList.add("on");
        }

        var offPop = function(){
            popups[id].classList.remove("on");
        }

        var hidePop = function(){
            setTimeout(function(){
                popups[id].classList.remove("show");
            }, 100);	
        }

        var openSidebar = function(){
            reader.SidebarController.changePanelTo('Notes');
            reader.SidebarController.show();
        };

        item.addEventListener("mouseover", showPop, false);
        item.addEventListener("mouseout", hidePop, false);
        item.addEventListener("click", openSidebar, false);

    }

    $anchor.on("click", function(e){
        if ($anchor[0].classList.contains("icon-room")) {
            $anchor.removeClass("icon-room");
            $anchor.addClass("icon-location_off");
            $text.prop("disabled", true);
            // disable extra-wide navigation as it interferes with anchor placment
            if ($prev.hasClass("touch_nav")) {
                $prev.removeClass("touch_nav");
                $next.removeClass("touch_nav");
                $prev.addClass("restore_touch_nav");
            }
            // listen for selection
            $viewer.on("click", insertAtPoint);
        } else {
            $text.prop("disabled", false);
            $anchor.removeClass("icon-location_off");
            $anchor.addClass("icon-room");
            if ($prev.hasClass("restore_touch_nav")) {
                $prev.removeClass("restore_touch_nav");
                $prev.addClass("touch_nav");
                $next.addClass("touch_nav");
            }

            $viewer.off("click", insertAtPoint);
        }
    });

    for (var note in annotations) {
        if (annotations.hasOwnProperty(note) && (annotations[note].type === "annotation"))
            addAnnotationItem(annotations[note]);
    };

    return {
        "show" : show,
        "hide" : hide,
        "createItem": createItem,
        "addItem" : addAnnotationItem,
        "removeAnnotation" : removeAnnotation
    };
};
