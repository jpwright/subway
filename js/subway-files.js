function handleFiles(files) {
    if (!files.length) {
        console.log("No files selected");
    } else {
        console.log(files);
    }
    
    var f = files[0];
    
    var reader = new FileReader();
    reader.onload = (function(theFile) {
        return function(e) {
            // Render thumbnail.
            JsonObj = JSON.parse(e.target.result);
            loadGameJSON(JsonObj);
        };
    })(f);

    // Read in the image file as a data URL.
    var d = reader.readAsText(f);
    
}