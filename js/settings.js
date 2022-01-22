window.addEventListener('DOMContentLoaded', function () {
    // save settings
    var readerSettings = {
        save : function() {
            var data = {
                    EpubEnable: document.getElementById('EpubEnable').checked ? 'true' : 'false',
                    PdfEnable: document.getElementById('PdfEnable').checked ? 'true' : 'false',
                    CbxEnable: document.getElementById('CbxEnable').checked ? 'true' : 'false'
            };

            OC.msg.startSaving('#reader-personal .msg');
            $.post(OC.generateUrl('apps/epubreader/settings/set'), data, readerSettings.afterSave);
        },
        afterSave : function(data){
            OC.msg.finishedSaving('#reader-personal .msg', data);
        }
    };
    $('#EpubEnable').on("change", readerSettings.save);
    $('#PdfEnable').on("change", readerSettings.save);
    $('#CbxEnable').on("change", readerSettings.save);
});
