/*!
 * Magic Board v1
 * Copyright 2015-2016 BinaryCodon, Inc.
 * Licensed under GNU Affero General Public License
 * Author - Rajeev Shrivastava
 */

var inheritsFrom = function (child, parent) {
    child.prototype = Object.create(parent.prototype);
};


var MagicBoard = {sheetBook:null,"indicators":{"mouseDown":false,"mouseover":[],"click":false,"doubleClick":0,"resize":-1},"boardPos":{x:0,y:0},"theme":{"sheetBackground":null,"shapeColor":"#1b8d11","arrowFillColor":"#1b8d11","borderColor":"white","lineColor":"#1b8d11","textColor":"white"},scratch:{"path":[]}
};

/*
 "background-color"
 "border-color"
 "border-width"
 "border-style"
 "text-color"
 "font-size"
 "font-weight"
 "line-type"
 "line-color"
 "end-marker"
 "start-marker"
 "mid-marker"
 */

MagicBoard.properties = {
    "background-color":{"propType":"attribute","propName":"fill","label":"Background Color","field":"input","values":[{"name":"","value":MagicBoard.theme.shapeColor,"type":"color"}]},
    "border-color":{"propName":"stroke","propType":"attribute","label":"Border Color","field":"input","values":[{"name":"","value":MagicBoard.theme.shapeColor,"type":"color"}]},
    "border-width":{"propName":"stroke-width","propType":"attribute","label":"Border Width","field":"input","values":[{"name":"","value":"1","type":"text"}]},
    "border-style":{"propName":"stroke-dasharray","propType":"attribute","label":"Border Style","field":"select","values":[{"name":"Dash","value":"5,5","type":""},{"name":"Solid","value":"","type":""},{"name":"Dotted","value":"1,1","type":""}]},
    "text":{"propName":"innerHTML","propType":"dom","label":"Text","field":"input","values":[{"name":"","value":"","type":"text"}]},
    "text-color":{"propName":"fill","propType":"attribute","label":"Text Color","field":"input","values":[{"name":"","value":"#ffffff","type":"color"}]},
    "font-size":{"propName":"font-size","propType":"attribute","label":"Font Color","field":"input",values:[{"name":"","value":"14","type":"text"}]},
    "font-weight":{"propName":"font-weight","propType":"attribute","label":"Font Weight","field":"select",values:[{"name":"Regular","value":"regular"},{"name":"Bold","value":"bold"},{"name":"Italic","value":"italic"}]},
    "text-content":{"propName":"innerHTML","propType":"dom","label":"Text","field":"input","values":[{value:""}]},
    "line-type":{"propName":"","propType":"function","field":"select","label":"Line Type",values:[{"name":"Straight",value:"straight"},{"name":"Zig Zag",value:"zig-zag"},{"name":"Brezier Curve",value:"brezier"},{"name":"Quadratic Curve",value:"quadratic"}]},
    "line-color":{"propName":"stroke","propType":"attribute","label":"Line Color","field":"input","values":[{"name":"","value":MagicBoard.theme.shapeColor,"type":"color"}]},
    "line-width":{"propName":"stroke-width","propType":"attribute","label":"Line Width","field":"input","values":[{"name":"","value":"1","type":"text"}]},
    "line-style":{"propName":"stroke-dasharray","propType":"attribute","label":"Line Style","field":"select","values":[{"name":"Solid","value":"","type":""},{"name":"Dash","value":"5,5","type":""},{"name":"Dotted","value":"1,1","type":""}]},
    "end-marker":{"propName":"marker-end","propType":"attribute","label":"End Marker","field":"select","values":[{"name":"Filled Arrow",value:"url(#fillArrowE)"},{"name":"Hollow Arrow",value:"url(#hollowArrowE)"},{"name":"Regular Arrow",value:"url(#lineArrowE)"},{"name":"Cicle",value:"url(#dot)"},{"name":"Hollow Diamond",value:"url(#hollowDiamond)"},{"name":"Filled Diamond",value:"url(#fillDiamond)"},{"name":"No Arrow",value:""}]},
    "start-marker":{"propName":"marker-start","propType":"attribute","label":"Start Marker","field":"select","values":[{"name":"Filled Arrow",value:"url(#fillArrowS)"},{"name":"Hollow Arrow",value:"url(#hollowArrowS)"},{"name":"Regular Arrow",value:"url(#lineArrowS)"},{"name":"Cicle",value:"url(#dot)"},{"name":"Hollow Diamond",value:"url(#hollowDiamond)"},{"name":"Filled Diamond",value:"url(#fillDiamond)"},{"name":"No Arrow",value:""}]},
    "mid-marker":{"propName":"marker-mid","propType":"attribute","field":"select","label":"Mid Marker","values":[{"name":"Dot",value:"url(#dot)"}]}
}
/**
 * SheetBook consists of many sheets, each sheet contains shapes, images and drawing etc.
 * @constructor
 */

var SheetBook = function(_anchorElement,_width,_height)
{

    this.cheight = 400;this.cwidth = 400;

    this.sheets = []; this.currentSheet = null;
    this.anchor = document.body; // the can be changed
    this.zoomPercent = 100; // at 100%
    this.zoomCompensate = 1;

    this.alignments = {"x":[],"y":[] };

    this.maxRedo = 5;
    this.garbage = document.createElement("div");
    this.garbage.setAttribute("style","display:none");


    document.body.appendChild(this.garbage);

    if (_height) this.cheight = _height; if (_width)  this.cwidth = _width; if (_anchorElement) this.anchor = _anchorElement;

    var anchorDim = _anchorElement.getBoundingClientRect();
    MagicBoard.boardPos = {x:anchorDim.left,y:anchorDim.top};


    Utility.SheetBook.createWorkItems(this);


    // attach mouse movements

    document.onmousedown = function(e) {
        return MagicBoard.eventStart(e);
    };

    document.onmousemove = function(e) {
        MagicBoard.eventContinue(e);
    };

    document.onmouseup = function(e) {
        MagicBoard.eventStop(e);
    };

    document.onkeyup = function(e) {
        event.preventDefault();
        MagicBoard.keyUp(e);
    };
    
    document.onscroll = function()
    {
        var anchorDim = MagicBoard.sheetBook.anchor.getBoundingClientRect();
        MagicBoard.boardPos = {x:anchorDim.left,y:anchorDim.top};
    }
}

/**
 * This Function allows propotionate zoom of the entire SheetBook
 * Underconstruction - not ready yet
 */
SheetBook.prototype.zoom = function(_zoomPercent)
{
    this.zoomPercent = _zoomPercent;
    this.anchor.style.zoom = _zoomPercent/100;
    this.zoomCompensate = 1+(100 - _zoomPercent)/100;
}

/**
 * This Function sets HTML Dom element as parent anchor
 * This is useful to put a sheetbook inside external HTML
 *  @param {HTMLElement} _anchor
 *  @returns - nothing
 */
SheetBook.prototype.setAnchorElement = function(_anchor)
{
    //if (typeof(anchor) === "HTMLDomElement")
    this.anchor = _anchor;
}

/**
 * This Function add sheets to existing sheetbook
 *  @param {Sheet} _sheet
 *  @returns - nothing
 */
SheetBook.prototype.addSheet = function(_sheet)
{

    this.sheets.push(_sheet);

    var canvas = _sheet.getCanvas();
    canvas.setAttribute("height",this.cheight);
    canvas.setAttribute("width",this.cwidth);
    canvas.style["width"] = this.cwidth+"px";
    canvas.style["height"] = this.cheight+"px";
    this.anchor.appendChild(canvas);

    this.setCurrentSheet(_sheet);

}
/**
 * This Function retrieves a sheet from SheetBook with a given name
 *  @param {String} _sheetName
 *  @returns - nothing
 */
SheetBook.prototype.getSheet = function(_sheetName)
{

    for (var i = this.sheets.length - 1; i > -1;i--)
    {
        var sheet = this.sheets[i];

        if (sheet.name === _sheetName)
        {
            return sheet;
        }

    }

    return null;
}
/**
 * This Function retrieves currently active Sheet in the SheetBook
 *  @returns - {Sheet} currentSheet
 */
SheetBook.prototype.getCurrentSheet = function()
{
    return this.currentSheet;
}

/**
 * This Function sets a sheet as active and current Sheet within the SheetBook
 *  @param {Sheet} _sheet
 *  @returns - nothing
 */
SheetBook.prototype.setCurrentSheet = function(_sheet)
{
    var name = null; var nameSearch = false; var found;
    if (typeof(_sheet) === "string")
    {
        name = _sheet;
        nameSearch = true;
    }

    for (var i = this.sheets.length - 1; i > -1;i--)
    {
        var sheet = this.sheets[i];
        sheet.canvas.style["visibility"] = "hidden"; // hide everything
        if (nameSearch)
        {
            if (sheet.name === name)
            {
                this.currentSheet = _sheet;
            }
        } else if (sheet === _sheet)
        {
            this.currentSheet = _sheet;
        }
    }


    
    // the below is no longer needed
    //Utility.SheetBook.attachWorkItems(_sheet);
    _sheet.canvas.style["visibility"] = "visible";
    // clean connect Canvas
    var connectCanvas = this.connectCanvas;
    MagicBoard.sheetBook.connectCtx.clearRect(0,0,connectCanvas.width,connectCanvas.height);

    return;
}


/**
 * This Function converts all the sheets within a SheetBook into a single combined image
 *  @returns - {String} dataURL - This Data Url can be directly used within an image element of an HTML
 */
SheetBook.prototype.getCombinedImage = function()
{
    var tempCtx = this.scratchCtx;
    if (!tempCtx) return;

    tempCtx.clearRect(0, 0, this.cwidth, this.cheight);
    // redraw all objects
    var sLen = this.shapes.length;
    for (var i = 0; i < sLen;i++)
    {
        var _shape = this.shapes[i];
        _shape.draw(tempCtx);
    }
    var dataURL = this.scratchCanvas.toDataURL();
    return dataURL;
}

/**
 * This Function sets the height in pixel of the SheetBook
 *  @param {Number} _height
 *  @returns - nothing
 */
SheetBook.prototype.setHeight = function(_height)
{
    this.cheight = _height;
    this.currentCanvas.setAttribute("height",this.cheight);
}

/**
 * This Function sets the width in pixel for the SheetBook
 *  @param {Number} _width
 *  @returns - nothing
 */

SheetBook.prototype.setWidth = function(_width)
{
    this.cwidth = _width;
    this.currentCanvas.setAttribute("width",_width);
}


/**
 * A Sheet is collection of drawingObjects
 * @constructor
 */
var Sheet = function(_options)
{
    this.options = {};
    if (_options) this.options = _options;
    this.name = "Sheet1";
    if (_options.name) this.name = _options.name;
    this.canvas = null;
    this.init();
}

/**
 * This Function is for internal use only, it initalizes the Sheet
 *  @returns - nothing
 */
Sheet.prototype.init = function()
{
    this.removedShapes = []; // keep only last 5

    this.canvas = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.canvas.setAttribute("id",this.name);
    this.canvas.style["position"] = "absolute";
    this.canvas.style["left"] = "0px";
    this.canvas.style["top"] = "0px";
    this.canvas.style["z-index"] = "1";
    this.canvas.setAttribute("name","mg");

    this.canvas.style["visibility"] = "visible";
    var backgroundColor = this.options["background-color"] ;
    if (backgroundColor) this.canvas.style["fill"] = backgroundColor;

    this.connections = [];
    Utility.Sheet.Markers(this);

    // create grids
    this.courseGridSize = {"x":100,"y":100};
    this.noOfXcourseGrids =  Math.floor(MagicBoard.sheetBook.cwidth / this.courseGridSize.x);
    this.noOfYcourseGrids = Math.floor(MagicBoard.sheetBook.cheight / this.courseGridSize.y);
    this.courseGrids = []; var gNo = 0;

    for (var y = 0; y < this.noOfYcourseGrids;y++)
    {
        var y1 = y * this.courseGridSize.y;
        var y2 = (y+1) * this.courseGridSize.y;

        for (var x = 0 ; x < this.noOfXcourseGrids; x++)
        {
            var x1 = x * this.courseGridSize.x;
            var x2 = (x+1) * this.courseGridSize.x;

            var grid = {"filled":false,shapes:[],"x1":x1,"x2":x2,"y1":y1,"y2":y2,"index":gNo++};
            this.courseGrids.push(grid);
        }
    }
    MagicBoard.sheetBook.currentSheet = this;
    this.shapes = [];
    if (this.options.shapes)
    {
        for (var s = 0, sLen = this.options.shapes.length;s < sLen ;s++)
        {
            var shape = new Shape(this.options.shapes[s]);
            shape.draw();
            shape.setPosition({x:shape.dimension.left,y:shape.dimension.top});// this is needed for middle point calculations and alignments
        }
    }
}

/**
 * This Function returns symbolic canvas. A Canvas does not necessarily be an HTML Canvas element.
 *  @returns - nothing
 */
Sheet.prototype.getCanvas = function()
{
    return this.canvas;
}
/**
 * This Function renames the sheet
 *  @param {String} - _newName
 *  @returns - nothing
 */
Sheet.prototype.rename = function(_newName)
{
    this.name = _newName;
    this.options.name = _newName;
}

/**
 * This Function wipes any drawing, object etc within a Sheet
 *  @returns - nothing
 */
Sheet.prototype.wipe = function()
{
    var garbage = MagicBoard.sheetBook.garbage;
    var children = this.canvas.children;
    for (var i = children.length - 1; i > -1;i--)
    {
        var child = children[i];
        if (child.getAttribute("name") === "workItem") continue;
        garbage.appendChild(child);
    }

    garbage.innerHTML = "";

}

/**
 * This Function Calculates and Aggregates the area of all the shapes within a Sheet
 *  Underconstruction
 *  @returns - {float} - area
 */
Sheet.prototype.totalShapeArea = function()
{

}

/**
 * This Function adds shapes and registers it for the sheet
 *  @param {Shape} _shape
 *  @returns - nothing
 */
Sheet.prototype.addShape = function(_shape)
{
    this.shapes.push(_shape);
}
/**
 * This Function removes the last added Shape in the Sheet
 *  @returns - nothing
 */
Sheet.prototype.removeLastShape = function()
{
    var maxRedo = MagicBoard.sheetBook.maxRedo;
    if (this.shapes.length === 0) return;

    var info = this.shapes[this.shapes.length - 1];

    this.removedShapes.push(info);
    if (this.removedShapes.length > maxRedo)
    {
        this.removedShapes.splice(0,1); // remove the oldest
    }
    this.shapes.pop();
}

/**
 * This Function removes a given Shape from the SheetBook
 *  @param {Shape} _shape
 *  @returns - nothing
 */
Sheet.prototype.removeShape = function(_shape)
{
    if (this.shapes.length === 0) return;

    for (var i = this.shapes.length - 1;i > -1;i--)
    {
        var shape = this.shapes[i];
        if (shape === _shape)
        {
            this.shapes.splice(i,1);
            return;
        }
    }
}

/**
 * This Function redraws (or repaints) the Sheet
 *  @returns - nothing
 */
Sheet.prototype.reDraw = function()
{
    this.wipe();

    var sLen = this.shapes.length;
    for (var i = 0; i < sLen;i++)
    {
        var _shape = this.shapes[i];
        _shape.createCanvas();
        _shape.draw();
    }
}

/**
 * This Function undoes the last added or deleted Shape
 *  Property changes are undone yet, will be added in the next upcoming versions
 *  @returns - nothing
 */
Sheet.prototype.undo = function()
{
    this.removeLastShape();
    this.reDraw();
}

/**
 * This Function redoes the last undo invokation
 *  Upto 5 redos are allowed and this is controled by maxRedo variable
 *  @returns - nothing
 */
Sheet.prototype.redo = function()
{
    if (this.removedShapes.length === 0) return; // nothing to redo

    this.shapes.push(this.removedShapes[0]);
    this.removedShapes.splice(0,1);

    this.reDraw();
}

/**
 * This Function rebuilds the connections (connecting lines between Shapes)
 *  @returns - nothing
 */
Sheet.prototype.refreshConnections = function()
{
    var sLen = this.shapes.length;
    for (var i = 0; i < sLen;i++)
    {
        var _shape = this.shapes[i];
        _shape.refreshConnection();
    }
}
/**
 * This Function converts the Sheet into an image
 *  @param - {String} _type - type of image to download
 *  @returns - {DataURL} dataURL
 */
Sheet.prototype.getImage = function(_type)
{

    var svg = this.canvas.cloneNode();
        
    var shapes = this.shapes;var sLen = shapes.length;
    var minX = 9999, minY=9999, maxX=0, maxY=0;
        for (var s = 0; s < sLen;s++)
        {
            var shape = shapes[s];
            var g = shape.drawSVG();
            svg.appendChild(g);
            var dim = shape.frame;
            if (dim.left < minX) minX = dim.left;
            if (dim.top < minY) minY = dim.top;
            if (dim.right > maxX) maxX = dim.right;
            if (dim.bottom > maxY) maxY = dim.bottom;
        }
    maxX += 10; maxY += 10; // add extra 10 bytes padding
    svg.setAttribute("x",0);svg.setAttribute("y",0);
    svg.setAttribute("width",maxX);svg.setAttribute("height",maxY );
    svg.style["width"] = maxX +"px";svg.style["height"] = maxY +"px";
    var serializer = new XMLSerializer();
    var str = serializer.serializeToString(svg);
    if (_type === "svg")
    {
        return {"dataURL":str,"size":{width:maxX,height:maxY}};
    } else
    {
        var img = document.createElement("IMG");
        img.src = "data:image/svg+xml;utf8,"+encodeURI(str);
        //console.log(img.src);
        var canvas = document.createElement("canvas");
        
        canvas.height = maxY ; canvas.width = maxX ;
        
        var context = canvas.getContext("2d");
        context.drawImage(img,0,0,canvas.width,canvas.height);
        //document.body.appendChild(canvas);
        
        var dataURL = canvas.toDataURL();
        return {"dataURL":dataURL,"size":{width:canvas.width,height:canvas.height}};
    }
}

/**
 * This Function returns existing connections between two shapes
 *  @param {Shape} -  _beginShape
 *  @param {Shape} -  _endShape
 *  @returns {Object} - cInfo
 */
Sheet.prototype.getConnection = function(_beginShape, _endShape)
{

    var conn = this.connections;
    var cLen = conn.length;
    var found = false;
    for (var i = 0; i < cLen;i++)
    {
        var cI = conn[i];
        if (cI.beginShape === _beginShape && cI.endShape === _endShape)
        {
            return cI;
        }
    }
}

/**
 * This Function adds connections between two shapes
 *  @param {Object} _cInfo - Has the following format {"beginShape":shape,"endShape":shape,pos:{x1:0,y1:0,x2:100,y2:100}}
 *  @returns - nothing
 */
Sheet.prototype.addConnections = function(_cInfo)
{
    var beginShape = _cInfo.beginShape; var endShape = _cInfo.endShape;

    var conn = this.connections;
    var cLen = conn.length;
    var found = false;
    for (var i = 0; i < cLen;i++)
    {
        var cI = conn[i];
        var pos = _cInfo.pos;
        if (cI.beginShape === beginShape && cI.endShape === endShape)
        {
            found = true;
            cI.pos = pos; // update new pos
            cI.orientation = _cInfo.orientation;
            return cI;
        }
    }
    if (!found)
        conn.push(_cInfo);
    return _cInfo;
}
/**
 *  This function finds shape(s) in the sheet where the position is within
 *  @param {Point} _pos - contain pointer position to find shapes containing it.
 *  @return {Array} shapes - Array of shapes that contain the pointer
 */

Sheet.prototype.findShapeByPosition = function(_pos)
{
    var shapes = [];
    for (var s = 0,sLen = this.shapes.length; s < sLen;s++)
    {
        var shape = this.shapes[s];
        if (shape.contains(_pos)) {shapes.push(shape);}
    }
    return shapes;
}
/**
 *  This function returns saved json format
 *  @return {Object} saved JSON
 */
Sheet.prototype.save = function()
{
    var saved = {};
    saved.options = this.options;
    saved.shapes = [];
    for (var s = 0,sLen = this.shapes.length; s < sLen;s++)
    {
        var shape = this.shapes[s];
        var shapeJson = shape.save();
        if (shapeJson) saved.shapes.push(shapeJson);
    }
    return saved;
}

/**
 * This function changes theme color of the sheet objects
  * @param {Color} _backgroundColor
  * @param {Color} _shapeColor
  * @param {Color} _arrowFillColor
  * @param {Color} _borderColor
  * @param {Color} _lineColor
 *
 */
Sheet.prototype.changeThemeColor = function(_backgroundColor,_shapeColor,_arrowFillColor,_borderColor,_lineColor)
{
    if (_backgroundColor) MagicBoard.theme.backgroundColor = _backgroundColor;
    if (_shapeColor) MagicBoard.theme.shapeColor = _shapeColor;
    if (_arrowFillColor) MagicBoard.theme.arrowFillColor = _arrowFillColor;
    if (_borderColor) MagicBoard.theme.borderColor = _borderColor;
    if (_lineColor) MagicBoard.theme.lineColor = _lineColor;
    
    for (var s = 0,sLen = this.shapes.length; s < sLen;s++)
    {
        var shape = this.shapes[s];
        shape.changeThemeColor(_shapeColor,_borderColor,_lineColor);
    }
}

/**
 * This Function removes any connection to the shape. The connection can be incoming or outgoing
 *  @param {Shape} _shape
 *  @returns - nothing
 */
Sheet.prototype.removeConnections = function(_shape)
{
    //
    var beginShapes = _shape.connectedFrom;
    var found = false;
    var bLen = beginShapes.length;
    for (var b = 0; b < eLen ; b++)
    {
        var beginShape = beginShapes[b];
        Utility.Sheet.removeConnection(this,beginShape,_shape);
    }

    var endShapes = _shape.connectedTo;
    var eLen = endShapes.length;
    for (var e = 0; e < eLen ; e++)
    {
        var endShape = endShapes[e];
        Utility.Sheet.removeConnection(this,_shape,endShape);
    }

    return ;
}

/**
 * This Function draws or paint all the connecting lines between the Shapes
 *  This function has  undergone changes hence may not be working at this point. Will fix it in the next release
 *  @returns - nothing
 */
Sheet.prototype.drawConnections = function(_context)
{
    var ctx = _context;
    if (!_context)
    {
        setTimeout(function(){
                   Utility.SheetBook.clearScratchCanvas() ;
                   },700);
        /*
         var canvas = MagicBoard.sheetBook.connectCanvas;
         ctx = MagicBoard.sheetBook.connectCtx;
         ctx.clearRect(0,0,canvas.width,canvas.height);
         */

    }
    /*
     var garbage = MagicBoard.sheetBook.garbage;
     var children = this.canvas.children;
     for (var c = children.length -1;c > -1;c--)
     {
     var child = children[c];
     if (child && child.nodeType === 1 && child.getAttribute("name") == "connection" )
     {
     garbage.appendChild(child);
     }
     }
     garbage.innerHTML = "";
     */
    //ctx.strokeStyle = MagicBoard.theme.shapeColor;
    //ctx.lineWidth = 2;
    //ctx.setLineDash([5, 0]);

    var conn = this.connections;
    var cLen = conn.length;
    var angle = null;
    for (var i = 0; i < cLen;i++)
    {
        var cInfo = conn[i];
        /*
         var pos = cInfo.pos;
         var midX = (pos.x1+pos.x2)/2;
         var midY = (pos.y1+pos.y2)/2;
         ctx.beginPath();
         ctx.moveTo(pos.x1,pos.y1);
         if (cInfo.orientation === "vert")
         {
         ctx.lineTo(pos.x1,midY);
         ctx.lineTo(pos.x2,midY);
         angle = Drawing.getLineAngle(pos.x2,pos.y2,pos.x2,midY);
         } else
         {
         ctx.lineTo(midX,pos.y1);
         ctx.lineTo(midX,pos.y2);
         angle = Drawing.getLineAngle(pos.x2,pos.y2,midX,pos.y2);
         }

         ctx.lineTo(pos.x2,pos.y2);
         ctx.stroke();
         */
        //var arrowCoord = Drawing.drawArrow(ctx,pos.x2,pos.y2,angle); // arrow for criss cross line
        if (cInfo.shape) {
            cInfo.shape.deleteShape(true); // keep the connection, just delete the shape
            cInfo.shape = null;
        }
        var cLine = new ConnectorLine(cInfo);
        cLine.draw();
    }
    /*
     for (var i = 0; i < cLen;i++)
     {
     var cInfo = conn[i];
     var pos = cInfo.pos;
     ctx.beginPath();
     ctx.moveTo(pos.x1,pos.y1);
     ctx.lineTo(pos.x2,pos.y2); // direct line
     //ctx.moveTo(pos.x1,pos.y1);
     //ctx.lineTo(pos.x1,pos.y2);
     //ctx.lineTo(pos.x2,pos.y2);
     ctx.stroke();
     var angle = Drawing.getLineAngle(pos.x2,pos.y2,pos.x1,pos.y1);
     var arrowCoord = Drawing.drawArrow(ctx,pos.x2,pos.y2,angle); // arrow for direct line
     //var angle = Drawing.getLineAngle(pos.x2,pos.y2,pos.x1,pos.y2);
     //var arrowCoord = Drawing.drawArrow(ctx,pos.x2,pos.y2,angle); // arrow for criss cross line
     }
     */

}

/**
 * Point represents 2d coordinate for any point in the space
 *  @constructor
 *  @param {Number} _x - represents X Coordinate
 *  @param {Number} _y - represents Y Coordinate
 *  @returns - nothing
 */
var Point = function(_x,_y)
{
    this.x = _x;
    this.y = _y;
}

/**
 * This Class is super class for all Shapes that can be drawn
 *  @constructor
 */
var DrawingObject = function()
{
    this.draw = function()
    {

    }
}

/**
 * This Class represents any Shape that can be added to the Sheet.
 *  @constructor
 *  @param {Object} - _desc - JSON Object describing the shape
 */
var Shape = function(_desc) {

    this.param = JSON.parse(JSON.stringify(_desc.param));
    this.frame = JSON.parse(JSON.stringify(_desc.frame));
    
    if (_desc.parent)
    {
        this.param.alignmentRails = false;
        this.param.noGridBlock = true;
        this.parentShape = _desc.parent;
        var parentDim = this.parentShape.dimension;
        _desc.frame.width = parentDim.width - 4;
        if (_desc.frame.height > parentDim.height) _desc.frame.height = parentDim.height - 4;
        
        this.frame.minLeft = parentDim.left;
        this.frame.maxRight = parentDim.left + parentDim.width;
        this.frame.minTop = parentDim.top;
        this.frame.maxBottom = parentDim.top + parentDim.height;
        
        this.parentShape.children.push(this);
    }

    
    // define min and max left and top
    if (!this.frame.minLeft) {this.frame.minLeft = 10;
        this.frame.maxRight = MagicBoard.sheetBook.cwidth;
    }
    if (!this.frame.minTop) {
        this.frame.minTop = 10;
        this.frame.maxBottom = MagicBoard.sheetBook.cheight;
    }

    // will define max left and top later
    
    if (_desc.events) this.events = _desc.events;
    else this.events = {
        "click": {"override": null, "post": null, "pre": null},
        "hover": {"override": null, "post": null, "pre": null},
        "doubleClick": {"override": null, "post": null, "pre": null}
    }
    /*
    events have the following details
     events : {
     "click":{"override":null,"post":showProperty,"pre":null},
     "hover":{"override":null,"post":null,"pre":null},
     "doubleClick":{"override":null,"post":null,"pre":null}
     }
     */
    if (_desc.connectedFromIds) this.connectedFromIds = _desc.connectedFromIds;
    if (_desc.connectedToIds) this.connectedToIds = _desc.connectedToIds;
    if (_desc.id) this.id = _desc.id;
    this.properties = {};
    this.components = [];
    var cLen = _desc.componentParms.length;
    for (var c = 0; c < cLen;c++)
    {
        var component = new ShapeComponent(_desc.componentParms[c]);
        this.components.push(component);
        for (var k in component.properties)
        {
            this.properties[k] = true;
        }
    }
    this.init();

}

inheritsFrom(Shape,DrawingObject);

Shape.prototype.init = function()
{

    if (!this.children) this.children = [];
    if (!this.components) this.components = [];

    if (this.param.alignmentRails == undefined) { this.param.alignmentRails = true;}
    this.occupiedGrids = [];


    this.currentSheet = MagicBoard.sheetBook.getCurrentSheet();
    this.sheetCanvas = this.currentSheet.getCanvas();
    if (this.frame)
    {
        this.createCanvas();
    }
    var dim = {"misc":{"unit":null,"key":[]}}; var borderWidth = null; var strokeStyle = null;var fillStyle = null;
    this.dimension = this.frame;
    if (!this.id) this.id = this.currentSheet.shapes.length;

    this.currentSheet.addShape(this);
    this.connectedTo = [];
    this.connectedFrom = [];
}

/**
 * This Function return JSON representation of the shape
 *  @returns {Object} - desc - JSON Object describing the shape
 */
Shape.prototype.getShapeDetail = function()
{
    var desc = {};
    desc.param = this.param ;
    desc.frame = this.frame ;
    desc.events = this.events;
    
        desc = JSON.parse(JSON.stringify(desc));
    desc.componentParms = [];
    //if (_desc.connectedFromIds) this.connectedFromIds = _desc.connectedFromIds;
    //if (_desc.connectedToIds) this.connectedToIds = _desc.connectedToIds;
    //if (_desc.id) this.id = _desc.id;

    
    var cLen = this.components.length;
    for (var c = 0; c < cLen;c++)
    {
        var component = this.components[c];
        var compDetail = component.getComponentDetails();
        desc.componentParms.push(compDetail);
    }

    return desc;
}

Shape.prototype.createCanvas = function()
{
    var width = Utility.Shape.dataFormatter(this.frame.width,"width",this);this.frame.width = width;
    var height = Utility.Shape.dataFormatter(this.frame.height,"height",this);this.frame.height = height;
    var domParent = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.dom  = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.dom.setAttribute("name","mg");
    this.dom.setAttribute("draggable","false");
    this.dom.setAttribute("width",width);
    this.dom.setAttribute("height",height);
    this.dom.setAttribute("pointer-events","all");
    this.dom.setAttribute("style","position:absolute;-ms-user-select:none;-webkit-user-select:none;z-index:10;transform:translate(1.5,1.5);z-index:1");
    this.dom.setAttribute("x", Utility.Shape.dataFormatter(this.frame.left,"left",this)) ;
    this.dom.setAttribute("y",Utility.Shape.dataFormatter(this.frame.top,"top",this));
    domParent.appendChild(this.dom);
    this.sheetCanvas.appendChild(domParent);

}


/**
 * This Function adds shape component to a shape
 * A Shape consists of one or many shape components such as text, rectangle, line, path & ellipse etc
 *  @param {ShapeComponent} _component
 *  @returns - nothing
 */
Shape.prototype.addComponent = function(_component)
{
    this.components.push(_component);
}

// events
/**
 * This Function adds characterstics to shape during hover
 *  This dictates when mouse goes over and out of a shape
 *  @returns - nothing
 */
Shape.prototype.addHover = function()
{
    var shape = this;
    var dom = this.dom;

    dom.onmouseover = function () {
        
        MagicBoard.indicators.mouseover.push(shape);
        if (MagicBoard.indicators.lineActive === shape)
        {
            // reentry
            MagicBoard.scratch.connectToSame = true;
        }
        //console.log("mouse over "+event.target+" current "+event.currentTarget);
    }

    dom.onmouseout = function () {
        event.preventDefault();
        // find the shape and remove it
        for (var i = MagicBoard.indicators.mouseover.length -1;i > -1;i--)
        {
            if (MagicBoard.indicators.mouseover[i] === shape)
            {
                MagicBoard.indicators.mouseover.splice(i,1);
                return;
            }
        }
        //console.log("mouse out "+event.target+" current "+event.currentTarget);
    }
}

/**
 * This Function defines action during a single click on a shape
 *  @returns - nothing
 */
Shape.prototype.click = function()
{
    var ev = this.events;
    if (ev)
    {
        if (!ev.click) ev.click = {"override":null,"pre":null,"post":null};
        if (ev.click.override) {return window[ev.click.override].call(this);}
        if (ev.click.pre) window[ev.click.pre].call(this);
    }

    this.selectToggle();
    // THIS MOVED TO SELECTTOGGLE --- if (ev.click.post) ev.click.post.call(this);
}

/**
 * This Function defines action during double click on a shape
 *  @returns - nothing
 */

Shape.prototype.doubleClick = function()
{
    var targetShape = this;
    var target = event.target;
    if (target instanceof SVGTextElement)
    {
        var dim = target.getBoundingClientRect();
        var editor = MagicBoard.sheetBook.textEditor;
        editor.style.left = dim.left - 2;editor.style.top = dim.top - 2;
        editor.style.width = dim.width + 4;editor.style.height = dim.height + 4;
        editor.style.display = "block";
        editor.innerHTML = target.innerHTML;
        editor.targetShape = targetShape;
        editor.focus();
        // updates are reflected in a blur function that was created in Utility.SheetBook.createWorkItems
    }

}

/**
 * This Function defines behavior of Shape when user is moving it
 *  @param {Point} pos - contains current mouse position {x,y}
 *  @param {Point} clickPos - contains start position of the mouse
 *  @returns - nothing
 */
Shape.prototype.move = function(pos,clickPos)
{
    var dim = this.getDimension();
    var diffY = pos.y - clickPos.y;
    var diffX = pos.x - clickPos.x;

    var top = dim.top + diffY; var bottom = dim.bottom + diffY;
    var left = dim.left + diffX; var right = dim.right + diffX;
    

    var ctx = MagicBoard.sheetBook.scratchCtx;
    
    var canvas = MagicBoard.sheetBook.scratchCanvas;
    
    // check for alignments
    if (MagicBoard.scratch.prevAlign)
    {
        if (MagicBoard.scratch.prevAlign.top)
        {
            if (Math.abs(top - MagicBoard.scratch.prevAlign.top) < 8)
            {
                top = MagicBoard.scratch.prevAlign.top;
            } else delete MagicBoard.scratch.prevAlign["top"];
        }
        
        if (MagicBoard.scratch.prevAlign.left)
        {
            if (Math.abs(left - MagicBoard.scratch.prevAlign.left) < 8)
            {
                left = MagicBoard.scratch.prevAlign.left;
            } else delete MagicBoard.scratch.prevAlign["left"];
        }
        
        if (MagicBoard.scratch.prevAlign.bottom)
        {
            if (Math.abs(bottom - MagicBoard.scratch.prevAlign.bottom) < 8)
            {
                bottom = MagicBoard.scratch.prevAlign.bottom;
                var diff = bottom - dim.bottom;
                top = dim.top + diff;
            } else delete MagicBoard.scratch.prevAlign["bottom"];
        }
        
        if (MagicBoard.scratch.prevAlign.right)
        {
            if (Math.abs(right - MagicBoard.scratch.prevAlign.right) < 8)
            {
                right = MagicBoard.scratch.prevAlign.right;
                var diff = right - dim.right;
                left = dim.left + diff;
            } else delete MagicBoard.scratch.prevAlign["right"];
        }
        
        var found = false;
        for (var k in MagicBoard.scratch.prevAlign)
        {
            found = true; break;
        }
        if (!found) {
            delete MagicBoard.scratch["prevAlign"];
            ctx.clearRect(0,0,canvas.width,canvas.height);
        }
    }
    else {
        var found = this.alignmentCheck(ctx,canvas.width,canvas.height,top,left,bottom,right);
        if (!found) ctx.clearRect(0,0,canvas.width,canvas.height);
    }



    ctx.beginPath();
    ctx.strokeStyle = "green";
    ctx.setLineDash([2, 2]);
    ctx.lineWidth = 4;
    ctx.rect(left - 2,top - 2,(dim.width+4),(dim.height+4));

    ctx.stroke();

    // done with the alignments
}

/**
 * This Function is invoked from while resizing event (continue) is going on
 * It dectates the behavior during resizing continuation
 *  @param {Point} pos - contains current mouse position {x,y}
 *  @param {Point} clickPos - contains start position of the mouse
 *  @returns - nothing
 */
Shape.prototype.resizeContinue = function(pos,clickPos)
{
    //var stretcher = MagicBoard.sheetBook.stretcher;
    var hilighter = MagicBoard.sheetBook.hilighter;
    //var hilightImage = hilighter.getElementsByTagName("IMG")[0];
    var resize = MagicBoard.indicators.resize;
    if (resize < 2)
    {
        var diffX = pos.x - clickPos.x;
        Utility.Shape.resize(this,diffX,-1);
    } else if (resize < 4)
    {
        var diffY = pos.y - clickPos.y;
        Utility.Shape.resize(this,-1,diffY);
    } else
    {
        var diffX = pos.x - clickPos.x;
        var diffY = pos.y - clickPos.y;
        Utility.Shape.resize(this,diffX,diffY);
    }
    Utility.SheetBook.resizeHilighter(this.dimension,this);

}
/**
 * This Function dictates the behavior after resize event is finished
 *  @returns - nothing
 */
Shape.prototype.resizeStop = function()
{
    var pos = MagicBoard.indicators.resizeStarted;
    var clickPos = MagicBoard.indicators.click;
    var newPos = {"x":this.dimension.left,"y":this.dimension.top};
    var hilighter = MagicBoard.sheetBook.hilighter;
    hilighter.style["visibility"] = "hidden";
    hilighter.style["transform"] = "";
    this.dom.style["transform"] = "";
    this.dimension.resizeX = null;
    this.dimension.resizeY = null;
    this.dimension.resizeWidth = null;
    this.dimension.resizeHeight = null;

    Utility.Shape.definePeriferalPoints(this.dimension);
    // recalculate shape Dim

    MagicBoard.indicators.resize = -1;
    MagicBoard.indicators.resizeStarted = null;
    this.selectToggle();
}

/**
 * This Function draws a temporary line on scratch canvas from the shape on a sheet
 *  @param {Point} pos - represents the point where current mouse position is
 *  @returns - nothing
 */
Shape.prototype.lineTo = function(pos)
{
    var ctx = MagicBoard.sheetBook.scratchCtx;
    /*var dim = this.getDimension();
    
    var canvas = MagicBoard.sheetBook.scratchCanvas
    ctx.clearRect(0,0,canvas.width,canvas.height);

    ctx.beginPath();
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.moveTo(dim.cx,dim.cy);
    */
    ctx.lineTo(pos.x,pos.y);
    ctx.stroke();
    //ctx.setLineDash([5, 0]);
    /*
    var angle = Drawing.getLineAngle(pos.x,pos.y,dim.left,dim.top);
    Drawing.drawArrow(ctx,pos.x,pos.y,angle);
     */
    // draw arrow
    //
}

// _context could be external canvas context to draw on
/**
 * This Function refreshes Connections between shapes
 *  @param {2D_Context} _context - this is not needed in the current version
 *  @returns - nothing
 */
Shape.prototype.refreshConnection = function(_context)
{
    var currentSheet = this.currentSheet;
    var cInfos = [];

    var beginShapes = this.connectedFrom;

    var bLen = beginShapes.length;

    for (var b = 0; b < bLen;b++)
    {
        var beginShape =  beginShapes[b];
        // get existing cInfo
        var cInfo = currentSheet.getConnection(beginShape,this);
        Utility.Shape.reCalculateConnectionPoints(cInfo);
        currentSheet.drawConnections(_context);
    }

    var endShapes = this.connectedTo;

    var eLen = endShapes.length;
    for (var e = 0; e < eLen ; e++)
    {
        endShape = endShapes[e];
        
        var cInfo = currentSheet.getConnection(this,endShape);
        Utility.Shape.reCalculateConnectionPoints(cInfo);

        //currentSheet.addConnections(cInfo);
        currentSheet.drawConnections( _context);
    }


}

/**
 * This Function creates an incoming connection from another shape to this shape
 *  @param {Shape} _beginShape - provide the shape from where the connection is originating
 *  @returns - nothing
 */
Shape.prototype.connectFrom = function(_beginShape)
{
    var beginShapes = this.connectedFrom;
    var found = false;
    var bLen = beginShapes.length;
    for (var b = 0; b < bLen ; b++)
    {
        var beginShape = beginShapes[b];
        if (_beginShape === beginShape) { found = true;break;}
    }

    if (!found) this.connectedFrom.push(_beginShape);
}

/**
 * This Function creates an outgoing connection from this shape to another shape
 *  @param {Shape} _endShape - provide the shape  where the connection is terminating
 *  @param {Object} _connProp - provides connector properties,e.g. {"type":"TWOBEND","end":"filled","begin":null}
 *     type can be - "DIRECT","ONEBEND","TWOBEND"
 *     end or begin arrows can be - "FILLED","DOT","HOLLOW","REGULAR:
 *  @returns - nothing
 */
Shape.prototype.connectTo = function(_endShape,_connProp)
{
    var ev = this.events;
    if (!_connProp)
    {
        // if there is no connection property, it must be the first time call, check events override
        if (ev)
        {
            if (ev.connectTo && ev.connectTo.override) {window[ev.connectTo.override].call(this,_endShape);return;}
        }
        _connProp = {"type":"TWOBEND","end":"FILLED","begin":null}; // default connection
    } // else go ahead with connection

    Utility.Shape.connectTo(this,_endShape,_connProp);

}

/**
 * This Function is used to create alignment rail
 *  @param {2D_Context} ctx - this is the context of scratch canvas, this may not be needed in future releases
 *  @param {Number} cw - width of the shape
 *  @param {Number} ch - height of the shape
 *  @param {Number} top - top coordinate of the shape
 *  @param {Number} left - left coordinate of the shape
 *  @param {Number} bottom - bottom coordinate of the shape
 *  @param {Number} right - right coordinate of the shape
 *  @param {Number} bound - is not currently used
 *  @returns - nothing
 */
Shape.prototype.alignmentCheck = function(ctx,cw,ch,top,left,bottom,right,bound)
{
    var found = false;
    var sides = [];

    if (MagicBoard.sheetBook.alignments.x[top])
    {
        sides.push("top");
        found = true;
       
        if (!MagicBoard.scratch.prevAlign) MagicBoard.scratch.prevAlign = {};
        MagicBoard.scratch.prevAlign.top = top;
    }

    if (MagicBoard.sheetBook.alignments.x[bottom])
    {
        sides.push("bottom");
        found = true;

        if (!MagicBoard.scratch.prevAlign) MagicBoard.scratch.prevAlign = {};
        MagicBoard.scratch.prevAlign.bottom = bottom;
    }

    if (MagicBoard.sheetBook.alignments.y[left])
    {
        sides.push("left");
        found = true;

        if (!MagicBoard.scratch.prevAlign) MagicBoard.scratch.prevAlign = {};
        MagicBoard.scratch.prevAlign.left = left;
    }

    if (MagicBoard.sheetBook.alignments.y[right])
    {
        sides.push("right");
        found = true;

        if (!MagicBoard.scratch.prevAlign) MagicBoard.scratch.prevAlign = {};
        MagicBoard.scratch.prevAlign.right = right;
    }

    if (sides.length > 0)
    {
        ctx.beginPath();
        ctx.strokeStyle = "gray";
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        
        for (var s = sides.length - 1;s > -1;s--)
        {
            var side = sides[s];
            switch (side)
            {
                case "top":
                    ctx.moveTo(0,top);
                    ctx.lineTo(cw,top);
                    break;
                case "bottom":
                    ctx.moveTo(0,bottom);
                    ctx.lineTo(cw,bottom);
                    break;
                case "left":
                    ctx.moveTo(left,0);
                    ctx.lineTo(left,ch);
                    break;
                case "right":
                    ctx.moveTo(right,0);
                    ctx.lineTo(right,ch);
                    break;
            }

        }
        ctx.stroke();
        ctx.setLineDash([5, 0]);
    }
    
    return found;

}

/**
 * This Function is used to find if a point is within the shape
 *  @param {Point} _pos - position where left and top will be position
 *  @returns - {boolean} - answer - true/false
 */
Shape.prototype.contains = function(_pos)
{
    var dim = this.dimension;
    if ((_pos.x > dim.left) &&
        (_pos.x  < (dim.left + dim.width)) &&
        (_pos.y > dim.top) &&
        (_pos.y  < (dim.top + dim.height)) )
        {
            return true;
        }
        
    return false;
}

/**
 * This Function is used to set left,top position of the shape
 *  @param {Point} pos - position where left and top will be position
 *  @param {boolean} align - change the position to align with the nearest alignment within 50px (if exists)
 *  @returns - nothing
 */
Shape.prototype.setPosition = function(pos,align)
{
    if (this.param.alignmentRails)
    {
        this.removeAlignments();
    }
    var dim = this.frame;

    //if (dim.left === pos.x && dim.top === pos.y) return;
    /*
     var child = this.dom.firstElementChild;
     child.setAttribute("x",pos.x);
     child.setAttribute("y",pos.y);
     */

    if (pos.diffX)
    {
        if (dim.left) pos.x = dim.left + pos.diffX;
        if (dim.top) pos.y = dim.top + pos.diffY;
        
        if (this.parentShape)
        {
            var parentDim = this.parentShape.dimension;
            
            this.frame.minLeft = parentDim.left;
            this.frame.maxRight = parentDim.left + parentDim.width;
            this.frame.minTop = parentDim.top;
            this.frame.maxBottom = parentDim.top + parentDim.height;
        }
        
        /*
        this.frame.minLeft = this.frame.minLeft + pos.diffX;
        this.frame.maxRight = this.frame.maxRight + pos.diffX;
        this.frame.minTop = this.frame.minTop + pos.diffY;
        this.frame.maxBottom = this.frame.maxBottom + pos.diffY;
        */
        
    }
    // make sure Pos is within the boundary
    
    if (pos.x < this.frame.minLeft) pos.x = this.frame.minLeft;
    if (pos.y < this.frame.minTop) pos.y = this.frame.minTop;
    if (this.frame.maxRight < (pos.x + dim.width)) pos.x = this.frame.maxRight - dim.width - 5;
    if (this.frame.maxBottom < (pos.y+dim.height)) pos.y = this.frame.maxBottom - dim.height - 5;
    
    if (align)
    {
        // find nearest alignment and return coordinate
        pos = Utility.Shape.align(pos);
    }
    

    this.dom.setAttribute("x",pos.x );
    this.dom.setAttribute("y",pos.y);

    dim.left = pos.x;
    dim.top = pos.y;

    Utility.Shape.definePeriferalPoints(dim);
    

    this.refreshConnection();
    if (this.param.alignmentRails)
    {
        this.addAlignments();
    }
    if (!this.param.noGridBlock) Utility.Shape.blockGrids(this);
    
    for (var c =0, cLen=this.children.length;c < cLen;c++)
    {
        var child = this.children[c];
        child.setPosition(pos);
    }
}
/**
 * This Function is used to setDimension of the shape
 *  @param {Object} dim - provide dimension object for the shape
 *  @returns - nothing
 */
Shape.prototype.setDimension = function(dim)
{
    this.dimension = {"left":dim.left,"right":dim.right,"top":dim.top,"bottom":dim.bottom,"width":dim.width,"height":dim.height};

    this.addAlignments();
}


/**
 * This Function is removes alignment coordinates for this shape so they will not be used for any alignment checks
 *  @returns - nothing
 */
Shape.prototype.removeAlignments = function()
{
    var removeItem = function(_array,_item)
    {
        if (!_array) return false;
        var aLen = _array.length;
        if (aLen < 2) {return false;}

        for (var i = aLen - 1 ; i > -1 ; i--)
        {
            var item = _array[i];
            if (item === _item)
            {
                _array.splice(i,1);
                return;
            }
        }

    }
    var dim = this.dimension;

    var ind = removeItem(MagicBoard.sheetBook.alignments.y[dim.left],this) ; if (!ind) MagicBoard.sheetBook.alignments.y[dim.left] = null;
    ind = removeItem(MagicBoard.sheetBook.alignments.y[dim.right],this) ;if (!ind) MagicBoard.sheetBook.alignments.y[dim.right] = null;
    ind = removeItem(MagicBoard.sheetBook.alignments.y[dim.cx],this) ;if (!ind) MagicBoard.sheetBook.alignments.y[dim.cx] = null;
    ind = removeItem(MagicBoard.sheetBook.alignments.x[dim.top],this) ;if (!ind) MagicBoard.sheetBook.alignments.x[dim.top] = null;
    ind = removeItem(MagicBoard.sheetBook.alignments.x[dim.bottom],this) ;if (!ind) MagicBoard.sheetBook.alignments.x[dim.bottom] = null;
    ind = removeItem(MagicBoard.sheetBook.alignments.x[dim.cy],this) ;if (!ind) MagicBoard.sheetBook.alignments.x[dim.cy] = null;

}

/**
 * This Function adds alignment coordinate to sheet memory for any alignment check that other shapes can use
 *  @returns - nothing
 */
Shape.prototype.addAlignments = function()
{
    var dim = this.dimension;
    if (!MagicBoard.sheetBook.alignments.y[dim.left]) MagicBoard.sheetBook.alignments.y[dim.left] = [];
    MagicBoard.sheetBook.alignments.y[dim.left].push(this);

    if (!MagicBoard.sheetBook.alignments.y[dim.right]) MagicBoard.sheetBook.alignments.y[dim.right] = [];
    MagicBoard.sheetBook.alignments.y[dim.right].push(this);

    if (!MagicBoard.sheetBook.alignments.y[dim.cx]) MagicBoard.sheetBook.alignments.y[dim.cx] = [];
    MagicBoard.sheetBook.alignments.y[dim.cx].push(this);

    if (!MagicBoard.sheetBook.alignments.x[dim.top]) MagicBoard.sheetBook.alignments.x[dim.top] = [];
    MagicBoard.sheetBook.alignments.x[dim.top].push(this);

    if (!MagicBoard.sheetBook.alignments.x[dim.bottom]) MagicBoard.sheetBook.alignments.x[dim.bottom] = [];
    MagicBoard.sheetBook.alignments.x[dim.bottom].push(this);

    if (!MagicBoard.sheetBook.alignments.x[dim.cy]) MagicBoard.sheetBook.alignments.x[dim.cy] = [];
    MagicBoard.sheetBook.alignments.x[dim.cy].push(this);

}

/**
 * This Function gets the dimension object of the shape
 *  @returns - {Object} dimension - of the shape
 */
Shape.prototype.getDimension = function(dim)
{
    if (!this.dimension)     this.setDimension(this.dom.getBoundingClientRect());
    return this.dimension;
}

Shape.prototype.applyProperty = function(_propKey,_propName,_propType,_value,_propLabel,_propGroup)
{
    //{"attribute":"fill","label":"Background Color","field":"input","values":[{"name":"","value":MagicBoard.theme.shapeColor,"type":"color"}]}
    // look for all components that have that property and modify them
    for (var c = 0, cLen = this.components.length;c < cLen;c++)
    {
        var component = this.components[c];
        var prop = component.properties[_propKey];
        if (prop && prop.label === _propLabel && prop.group === _propGroup) component.applyProperty(_propName,_propType,_value,_propLabel,_propGroup);
    }
};

Shape.prototype.getProperties = function()
{
    var props = [];
    for (var c = 0, cLen = this.components.length;c < cLen;c++)
    {
        var component = this.components[c];
        for (var p in component.properties)
        {

            var prop = JSON.parse(JSON.stringify(MagicBoard.properties[p])) ;
            var compProp = component.properties[p];
            prop.group = compProp.group;
            prop.label = compProp.label;
            prop.keyName = p;
            
            
                var val = component.param[prop.propName];
                if (p === "text") val = component.innerHTML;
                if (val) {
                    if (prop.field === "input") prop.values[0].value = val;
                    else if (prop.field === "select") {
                        for (var v = 0, vLen = prop.values.length;v < vLen;v++)
                        {
                            if (prop.values[v].value == val) prop.values[v].selected = true;
                        }
                    }
                }
            props[props.length] = prop;
        }
    }
    return props;
}

/**
 * This Function returns the underlying HTML Dom for this shape
 *  @returns - {HTMLElement} - This element can be an SVG element too
 */
Shape.prototype.getDom = function()
{
    return this.dom;
}

/**
 * This Function is used to set points
 *  @param {Point} ctx - this is the context of scratch canvas, this may not be needed in future releases
 *  @returns - nothing
 */
Shape.prototype.setPoints = function(_points)
{
    // need to do closed shape check so as not to note down the last point again -- which is begin point as well
    this.points = _points;
};

/**
 * This Function returns the underlying area of the shape
 * under construction
 *  @returns - nothing
 */
Shape.prototype.getArea = function()
{

}

/**
 * This Function deletes the shape
 *  @returns - nothing
 */
Shape.prototype.deleteShape = function()
{
    MagicBoard.sheetBook.currentSheet.removeShape(this);
    var garbage = MagicBoard.sheetBook.garbage;
    // all the svg is inside a group element so get the parent and delete that
    var gParent = this.dom.parentNode;
    garbage.appendChild(gParent);
    garbage.innerHTML = "";

    // delete all objects
    for (var k in this)
    {
        if (typeof(this[k]) === "object")
        {
            if (k === "connectedTo")
            {
                var connected = this.connectedTo;
                MagicBoard.sheetBook.currentSheet.removeConnections(this);
                MagicBoard.sheetBook.currentSheet.drawConnections();
            } else if (k === "connectedFrom")
            {
                MagicBoard.sheetBook.currentSheet.removeConnections(this);
                MagicBoard.sheetBook.currentSheet.drawConnections();
            }
            this[k] = null;
        }
    }
}


/**
 * This Function is used to hilight or remove hilight from the Shape. Usually invoked during click
 *  @returns - nothing
 */
Shape.prototype.selectToggle = function()
{
    var dim = this.getDimension();
    var ctx = MagicBoard.sheetBook.scratchCtx;
    var canvas = MagicBoard.sheetBook.scratchCanvas
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // hilight the shape or remove hilite.
    var hilighter = MagicBoard.sheetBook.hilighter;
    if (MagicBoard.indicators.hilight)
    {
        hilighter.style["visibility"] = "hidden";
        setTimeout(function(){var shape = MagicBoard.indicators.hilight;MagicBoard.indicators.hilight = false;if (shape.events.click.post) window[shape.events.click.post].call(shape);},1);
        this.addAlignments();

    } else
    {
        var x = dim.left ; var y = dim.top; var parent = this.parentShape;
        /* no longer needed as child shape will have absolute coordinates
        while (parent)
        {
            x = x + parent.dimension.left; y = y + parent.dimension.top;
            parent = parent.parentShape;
        }
        */
        Utility.SheetBook.activateHilighter({"left":x,"top":y,"width":dim.width,"height":dim.height},this);


        MagicBoard.indicators.hilight = this;


        this.removeAlignments();
        if (this.events.click.post) {window[this.events.click.post].call(this);}
    }

}

/**
 * This Function is used to text component within the shape
 *  @param {String} _text - new text string
 *  @param {Number} _index - (optional) sequence of the text to be updated (starts with 0)
 *  @returns - nothing
 */
Shape.prototype.updateText = function(_text,_index)
{
    if (_index == undefined) _index = 0; var counter = 0;
    for (var c = 0, cLen = this.components.length;c < cLen;c++)
    {
        var component = this.components[c];
        if (component.type === "text") {
            if (counter === _index)
            {
                component.updateText(_text);
                break;
            }
            counter++;
        }
    }
}

/**
 *  This function returns saved json format
 *  @return {Object} saved JSON
 */
Shape.prototype.save = function()
{
    var saved = {};
    for (var k in this)
    {
        if (k === "cInfo") continue;
        if (k === "components")
        {
            saved["componentParms"] = [];
            var cLen = this.components.length;
            for (var c = 0; c < cLen ; c++)
            {
                var shapeComponent = this.components[c];
                saved["componentParms"].push(shapeComponent.save());

            }
            continue;
        }

        if (k === "connectedFrom" || k === "connectedTo")
        {
            saved[k+"Ids"] = [];
            var cLen = this[k].length;
            for (var c = 0; c < cLen ; c++)
            {
                var shape = this[k][c];
                saved[k+"Ids"].push(shape.id);
            }
            continue;
        }

        var name = this[k].constructor.name
        if ( name === "Number" || name === "String" || name === "Object" )
            saved[k] = this[k];

    }
    return saved;
}


/**
 * This Function is used to draw or paint the shape
 *  @returns - nothing
 */
Shape.prototype.draw = function() {
    var svg = this.dom; svg.innerHTML = "";
    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svg.appendChild(g);
    this.reDraw(g);
    var cLen = this.components.length;
    for (var c = 0; c < cLen ; c++)
    {
        var shapeComponent = this.components[c];
        shapeComponent.parentShape = this;
        var d = shapeComponent.construct();
        if (d) {
            g.appendChild(d);
        }
    }
    var ev = this.events;
    if (ev && ev.hover && ev.hover.override) {
            window[ev.hover.override].call(this);
        }
    else
        this.addHover();
}

/**
 * This Function is used to redraw or repaint the shape on the sheet
 *  @returns - nothing
 */
Shape.prototype.reDraw = function(g)
{
    var first = true;
    if (!g) {g = this.dom.firstElementChlid;first = false;}

    var cLen = this.components.length;
    for (var c = 0; c < cLen ; c++)
    {
        var shapeComponent = this.components[c];
        shapeComponent.parentShape = this;
        var d = shapeComponent.construct();
        if (first && d) {
            g.appendChild(d);
        }
    }
    this.refreshConnection();
}

/**
 * This Function is used to paint the shape on HTML Canvas element
 *  @param {2D_Context} _context - provide 2d context for the canvas
 *  @returns - nothing
 */
Shape.prototype.drawOnCanvas = function(_context)
{
    _context.beginPath();
    var cLen = this.components.length;
    for (var c = 0; c < cLen ; c++)
    {
        var shapeComponent = this.components[c];
        shapeComponent.drawOnCanvas(_context);
    }
    _context.stroke();
    this.refreshConnection(_context);
}

/**
 * This Function is used to paint the shape using SVG
 *  @returns - nothing
 */
Shape.prototype.drawSVG = function()
{
    var domParent = document.createElementNS("http://www.w3.org/2000/svg", "g");

    var offsetX = this.frame.left;
    var offsetY = this.frame.top;
    var cLen = this.components.length;
    for (var c = 0; c < cLen ; c++)
    {
        var shapeComponent = this.components[c];
        var dom = shapeComponent.drawSVG(offsetX,offsetY);
        domParent.appendChild(dom);
    }
    return domParent;
}

/**
 * This Function is used to change themecolor
 * @param {Color} _shapeColor
 * @param {Color} _borderColor
 * @oaran {Color} _lineColor
 *  @returns - nothing
 */
Shape.prototype.changeThemeColor = function(_shapeColor,_borderColor,_lineColor)
{
    if (!_shapeColor)  _shapeColor = MagicBoard.theme.shapeColor ;
    if (!_borderColor) _borderColor = MagicBoard.theme.borderColor ;
    
    var cLen = this.components.length;
    for (var c = 0; c < cLen ; c++)
    {
        var shapeComponent = this.components[c];
        shapeComponent.changeThemeColor(_shapeColor,_borderColor);
    }
}

/**
 * Connector Line Class is used draw connection between two shapes
 * The class itself inherits from Shape Class
 * @constructor
 * @param _cInfo - is an object that consists of the following pos (x1,y1,x2,y2)
 *               - properties
 *               - param
 */
var ConnectorLine = function(_cInfo)
{
    //
    var cLine = this;

    this.cInfo = _cInfo;

    var coord = Utility.Shape.defineConnectionCoordinates(this,_cInfo);

    this.param = {"alignmentRails":false,"noGridBlock":true};
    this.components = [];


    var conn = {"type":"path","origDim":{},"dimension":{"d":coord.d},
        "param":{"fill":"none","stroke":MagicBoard.theme.lineColor,"stroke-miterlimit":"10","stroke-width":2,"cursor":"hand"},
        "lines":coord.lines,
        properties:{"line-style":true,"line-type":true,"line-color":true,"start-marker":true,"end-marker":true,"mid-marker":true}}


    if (_cInfo.param) conn.param = _cInfo.param;
    if (_cInfo.properties) conn.properties = _cInfo.properties;

    if(_cInfo.connProp.style) {
        var lineType = _cInfo.connProp.style;
        if (lineType === "DASHED") conn.param["stroke-dasharray"] = "10,5";
        else if (lineType === "DOTTED") conn.param["stroke-dasharray"] = "1,4";
        else if (lineType === "SOLID" && conn.param["stroke-dasharray"]) {
            delete conn.param["stroke-dasharray"]; // remove stroke-dasharray
        }
    }
    
    var component = new ShapeComponent(conn);
    this.components.push(component);
    
    if(_cInfo.connProp.begin) {
        var dArray;
        var beginType = _cInfo.connProp.begin;
        var arrowComponent = Drawing.createArrowPath("start",beginType,this.cInfo.angleStart,{x:this.cInfo.pos.x1,y:this.cInfo.pos.y1},this.frame);
        this.components.push(arrowComponent);
    }
    
    if(_cInfo.connProp.end) {
        var dArray;
        var endType = _cInfo.connProp.end;
        var arrowComponent = Drawing.createArrowPath("end",endType,this.cInfo.angleEnd,{x:this.cInfo.pos.x2,y:this.cInfo.pos.y2},this.frame);
        this.components.push(arrowComponent);
    }
    
    this.properties = component.properties;
    if (_cInfo.events) this.events = _cInfo.events;
    var cdom = component.dom;

    cdom.onmouseover = function () {
        MagicBoard.indicators.mouseover.push(cLine);
        //console.log("mouse over"+MagicBoard.indicators.mouseover.length);
        var pos = MagicBoard.getPos(event);
        var starStyle = MagicBoard.sheetBook.star.style;
        starStyle["display"] = "block";starStyle["left"] = pos.x - 10; starStyle["top"] = pos.y - 10;
        MagicBoard.sheetBook.star.cLine = cLine;
        //console.log("mouse over "+event.target+" current "+event.currentTarget);
    }

    cdom.onmouseout = function () {
        event.preventDefault();
        setTimeout(function(){MagicBoard.sheetBook.star.style["display"] = "none";},300);
        // find the shape and remove it
        //console.log("mouse out");
        for (var i = MagicBoard.indicators.mouseover.length -1;i > -1;i--)
        {
            if (MagicBoard.indicators.mouseover[i] === cLine)
            {
                MagicBoard.indicators.mouseover.splice(i,1);
                return;
            }
        }

    }


    this.init();
    _cInfo.shape = this;
    _cInfo.properties = component.properties;
    _cInfo.param = component.param;
}

inheritsFrom(ConnectorLine,Shape);

/*
 Override functions
 */

/**
 * This Function is used to change themecolor
 * @param {Color} _shapeColor
 * @param {Color} _borderColor
 * @oaran {Color} _lineColor
 *  @returns - nothing
 */
ConnectorLine.prototype.changeThemeColor = function(_shapeColor,_borderColor,_lineColor)
{
    _shapeColor = MagicBoard.theme.arrowFillColor ;
    if (!_lineColor) _lineColor = MagicBoard.theme.lineColor ;
    
    var cLen = this.components.length;
    for (var c = 0; c < cLen ; c++)
    {
        var shapeComponent = this.components[c];
        shapeComponent.changeThemeColor(_shapeColor,_lineColor);
    }
}

ConnectorLine.prototype.save = function()
{
    // do not save connectors, let it rebuild
    return null;
}


ConnectorLine.prototype.drawOnCanvas = function(_context)
{
    _context.beginPath();
    var cLen = this.components.length;
    for (var c = 0; c < cLen ; c++)
    {
        var shapeComponent = this.components[c];
        shapeComponent.drawOnCanvas(_context);
        if (shapeComponent.param["marker-end"])
        {
            var type = shapeComponent.param["marker-end"];
            if (type === "url(#fillArrowE)") type = "Filled";
            else if (type === "url(#hollowArrowE)") type = "Hollow";
            else if (type === "url(#hollowDiamond)") type = "DiamondHollow";
            else if (type === "url(#fillDiamond)") type = "DiamondFilled";
            else if (type === "url(#dot)") type = "Dot";
            else type = "Regular";
            var lines = shapeComponent.lines; var last = lines[lines.length - 1];
            // hoping that first of line is lineTo if not we have to fix it in future
            Drawing.drawArrow(_context,(last.x + this.dimension.left ),(last.y + this.dimension.top),this.cInfo.angleEnd,type,shapeComponent.param.fill,shapeComponent.param.stroke);
        }
        if (shapeComponent.param["marker-start"])
        {
            var type = shapeComponent.param["marker-start"];
            if (type === "url(#fillArrowS)") type = "Filled";
            else if (type === "url(#hollowArrowS)") type = "Hollow";
            else if (type === "url(#hollowDiamond)") type = "DiamondHollow";
            else if (type === "url(#fillDiamond)") type = "DiamondFilled";
            else if (type === "url(#dot)") type = "Dot";
            else type = "Regular";
            var lines = shapeComponent.lines; var first = lines[0];
            // hoping that first of line is Move
            Drawing.drawArrow(_context,(first.x + this.dimension.left ),(first.y + this.dimension.top),this.cInfo.angleStart,type,shapeComponent.param.fill,shapeComponent.param.stroke);
        }
    }
    _context.stroke();
}
/*
 ConnectorLine.prototype.click = function()
 {

 if (MagicBoard.indicators.hilight)
 {
 MagicBoard.indicators.hilight = false;
 var circles = this.dom.getElementsByTagName("circle");
 var garbage = MagicBoard.sheetBook.garbage;
 for (var i = circles.length - 1;i > -1;i--) {garbage.appendChild(circles[i]);}
 garbage.innerHTML = "";
 } else
 {

 MagicBoard.indicators.hilight = this;
 var startDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
 startDot.setAttribute("cx",this.cx1);
 startDot.setAttribute("cy",this.cy1);
 startDot.setAttribute("r","7");
 startDot.setAttribute("style","fill:red;visibility:visible");

 this.dom.appendChild(startDot);

 var endDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
 endDot.setAttribute("cx",this.cx2);
 endDot.setAttribute("cy",this.cy2);
 endDot.setAttribute("r","7");
 endDot.setAttribute("style","fill:red;visibility:visible");

 this.dom.appendChild(endDot);
 }
 }
 */

/**
 * This Function overrides deleteShape function from parent Shape Class to delete the connection
 *  @returns - nothing
 */
ConnectorLine.prototype.deleteShape = function(keepConnection)
{
    var beginShape = this.cInfo.beginShape;
    var endShape = this.cInfo.endShape;




    MagicBoard.sheetBook.currentSheet.removeShape(this);
    var garbage = MagicBoard.sheetBook.garbage;
    var gParent = this.dom.parentNode;
    garbage.appendChild(gParent);
    garbage.innerHTML = "";

    if (!keepConnection)
    {
        // remove connection from sheet.connections
        var conn = this.currentSheet.connections;

        for (var c = 0,cLen = conn.length; c < cLen;c++)
        {
            var cI = conn[c];
            if (cI.beginShape === beginShape && cI.endShape === endShape)
            {
                conn.splice(c,1);
                break ;
            }
        }
        // null cInfo all objects
        for (var k in this.cInfo)
        {
            if (typeof(this.cInfo[k]) === "object")
            {
                this.cInfo[k] = null;
            }
        }
        var connectedTo = beginShape.connectedTo;
        for (var c = 0, cLen = connectedTo.length;c < cLen ;c++)
        {
            var shape = connectedTo[c];
            if (shape === endShape)
            {
                connectedTo.splice(c,1);
                break;
            }
        }
        var connectedFrom = endShape.connectedFrom;
        for (var c = 0, cLen = connectedFrom.length;c < cLen ;c++)
        {
            var shape = connectedFrom[c];
            if (shape === beginShape)
            {
                connectedFrom.splice(c,1);
                break;
            }
        }
    }


    // delete all objects
    for (var k in this)
    {
        if (typeof(this[k]) === "object")
        {
            this[k] = null;
        }
    }



    // now remove connectedFrom and ConnectedTo from begin and endShape
}

/**
 * ShapeComponent Class - represents individual component for a shape. A Shape can contain many shape components
 *   such as - line, rectangle, polygon, circle, path etc.
 *  @constructor
 *  @param {object}  _desc - is object that has the following structure
 *          {"dimension":{}, "param":{}, "properties":{}}
 */
var ShapeComponent = function(_desc) {
    for (var k in _desc)
    {
        this[k] = _desc[k];
    }

    this.parentShape = null;
    this.dom = document.createElementNS("http://www.w3.org/2000/svg", this.type);

    for (var k in this.param)
    {
        if (k === "border-radius")
        {
            this.dom.setAttribute("rx",this.param[k]);
            this.dom.setAttribute("ry",this.param[k]);
        } else
            this.dom.setAttribute(k,this.param[k]);
    }
    if (this.innerHTML) this.dom.appendChild(document.createTextNode(this.innerHTML)) ;
    this.dom.setAttribute("pointer-events","all");
    this.dom.setAttribute("draggable","false");
    this.dom.setAttribute("transform","translate(1,1)");
    this.dom.setAttribute("name","mg");
    this.derivedDimension = {};

    if (!this.properties)
    {
       this.properties = {};
    }

}

/**
 *  This will function will return a JSON representing the component
 *  @return {Object} jsonDescription
 */
ShapeComponent.prototype.getComponentDetails = function()
{
    var jsonDescription = {};
    jsonDescription.type = this.type;
    jsonDescription.dimension = JSON.parse(JSON.stringify(this.dimension));
    jsonDescription.param =  JSON.parse(JSON.stringify(this.param));
    
    if (this.innerHTML) jsonDescription.innerHTML = this.innerHTML;
    if (this.properties) jsonDescription.properties = this.properties;
    return jsonDescription;
}

/**
 *  This will paint the component. This method is invoked from Shape.draw
 *  @return {HTMLElement} dom
 */
ShapeComponent.prototype.construct = function()
{
    if (!this.parentShape) return;

    var dom = this.dom;
    this.derivedDimension = this.calculateDimensions();
    for (var k in this.derivedDimension)
    {
        this.dom.setAttribute(k,this.derivedDimension[k]);
    }

    if (this.type === "image")
    {
        var href = this.xlink;
        /*
        var img = document.createElement("img");
        img.src = href;
        var c = document.createElement("canvas");
        c.height = img.naturalHeight ; c.width = img.naturalWidth ;
        var cx = c.getContext("2d");
        cx.drawImage(img,0,0,c.width,c.height);

        var dataURL = c.toDataURL();
        */
        
        this.dom.setAttributeNS("http://www.w3.org/1999/xlink","href",href);
    }

    return dom;
}

/**
 *  This function returns saved json format
 *  @return {Object} saved JSON
 */
ShapeComponent.prototype.save = function()
{
    var saved = {};
    for (var k in this)
    {
        var name = this[k].constructor.name
        if ( name === "String" || name === "Object" )
            saved[k] = this[k];
    }
    return saved;
}

/**
 *  This function converts the % dimensions to real pixel
 *  @param {Number} _offsetX - offset from X
 *  @param {Number} _offsetY - offset from Y
 *  @return nothing
 */
ShapeComponent.prototype.calculateDimensions = function(_offsetX, _offsetY)
{
    var derivedDimension = {};
    if (!_offsetX) _offsetX = 0;
    if (!_offsetY) _offsetY = 0;
    //if (!this.dimensions) return; // no need to calculate it
    var margin = 0;
    if (this.param["stroke-width"])
    {
        margin = parseInt(this.param["stroke-width"]);
    }

    pw = this.parentShape.frame.width -2*margin;
    ph = this.parentShape.frame.height -2*margin;

    for (var k in this.dimension)
    {
        var val = "";
        var percentVal = this.dimension[k]
        switch (k)
        {
            case "width":
                val = (percentVal * pw / 100) - 2 * margin;
                break;
            case "x":
            case "x1":
            case "x2":
            case "cx":
                val = (percentVal * pw / 100) + margin + _offsetX;
                break;

            case "rx":
            case "r":
                val = (percentVal * pw / 100) -  margin;
                break;
            case "height":
                val = (percentVal * ph / 100) - 2*margin;
                break;
            case "y":
            case "y1":
            case "y2":
            case "cy":
                val = (percentVal * ph / 100) + margin + _offsetY;
                break;
            case "ry":
                val = (percentVal * ph / 100) - margin;
                break;
            case "d":
                // put path logic here
                if (!this.lines) this.lines = [];
                var dArray = percentVal;var dLen = dArray.length;
                for (var i = 0; i < dLen ;i++)
                {
                    var item = dArray[i];
                    if (item.op.toUpperCase() === "Z") {
                        val += " Z ";
                        break;
                    }
                    if (!this.lines[i]) this.lines.push({});
                    //val += item.op.toUpperCase() +Math.round( item.x * pw / 100)+" "+Math.round( item.y * ph / 100)+" ";
                    for (var ik in item)
                    {
                        var vl = item[ik];
                        if (ik.indexOf("x") > -1) vl = Math.round( item[ik] * pw / 100) + _offsetX ;
                        else if (ik.indexOf("y") > -1) vl = Math.round( item[ik] * ph / 100) + _offsetY;
                        this.lines[i][ik] = vl;
                        val += vl+" ";
                    }
                }
                break;
        }

        if (val) derivedDimension[k] = val;
    }
    
    if (this.type === "text" || this.type === "rect")
    {
        var dom = this.dom;
        if (this.dimension.cx)
        {
            var x =  parseInt(dom.getAttribute("cx")) - parseInt(dom.getAttribute("width"))/2 + _offsetX;
            derivedDimension.x = x;
        }
        if (this.dimension.cy)
        {
            var y = parseInt(dom.getAttribute("cy")) - parseInt(dom.getAttribute("height"))/2 + _offsetY;
            derivedDimension.y = y;
        }
    }
    return derivedDimension;
}

/**
 * This function is called from Shape.drawSVG for each of its components
 */
ShapeComponent.prototype.drawSVG = function(_offsetX, _offsetY)
{
    var dom = this.dom.cloneNode();
    var derivedDimension = this.calculateDimensions(_offsetX,_offsetY);
    for (var k in derivedDimension)
    {
        var val = derivedDimension[k];
        dom.setAttribute(k,val);
    }
    
    if (this.type === "image")
    {
        var href = this.xlink;
        dom.setAttributeNS("http://www.w3.org/1999/xlink","href",href);
    } else if (this.type === "text")
    {
        dom.innerHTML = this.dom.innerHTML;
    }
    return dom;
}

/**
 * This function is called from Shape.changeThemeColor for each of its components
 * @param {Color} _shapeColor
 * @param {Color} _lineColor
 */
ShapeComponent.prototype.changeThemeColor = function(_shapeColor,_lineColor)
{
    
    if (!_shapeColor)  _shapeColor = MagicBoard.theme.shapeColor ;
    if (!_lineColor) _lineColor = MagicBoard.theme.lineColor ;
    
    if (this.type === "text" ) _shapeColor = MagicBoard.theme.textColor;
    
    var dom = this.dom;
    if (_shapeColor && this.param["fill"])
    {
        this.param["fill"] = _shapeColor;
        dom.setAttribute("fill",_shapeColor);
    }
    if (_lineColor && this.param["stroke"])
    {
        this.param["stroke"] = _lineColor;
        dom.setAttribute("stroke",_lineColor);
    }
}

/**
 *  This function is used to convert svg to canvas
 *  @return {HTMLElement} - dom
 */
ShapeComponent.prototype.drawOnCanvas = function(_context)
{
    var left = this.parentShape.dimension.left;
    var top = this.parentShape.dimension.top;

    var margin = 0;
    if (this.param["stroke-width"])
    {
        margin = parseInt(this.param["stroke-width"]);
    }

    var x = this.derivedDimension.x + left;
    var y = this.derivedDimension.y + top;
    if (!x) x = left;
    if (!y) y = top;
    var fill = this.param["fill"];
    if (fill === "none") fill = "";
    var dashSet = false;
    if (this.param["stroke-dasharray"]) {
        var str = this.param["stroke-dasharray"]; var arr = str.split(",");
        _context.setLineDash(arr); dashSet = true;
        //setLineDash([1, 15]);
    }

    switch (this.type)
    {
        case "rect":
            if (fill)
            {
                _context.fillStyle = fill;
                _context.fillRect(x,y,this.derivedDimension.width,this.derivedDimension.height);
            } else _context.strokeRect(x,y,this.derivedDimension.width,this.derivedDimension.height);
            break;
        case "circle":
            break;
        case "ellipse":
            var cx = this.derivedDimension.cx + left;
            var cy = this.derivedDimension.cy + top;
            Drawing.drawEllipse(_context, cx , cy , this.derivedDimension.rx , this.derivedDimension.ry, fill, this.param["stroke"] );
            break;
        case "path":
            Drawing.drawLines(_context,left,top,this.derivedDimension.d,fill,this.param["stroke"],margin );
            break;
        case "polyline":
            break;
        case "text":
            if (fill) _context.fillStyle = fill;
            if (this.param["stroke"] ) _context.strokeStyle = this.param["stroke"] ;
            _context.fillText(this.innerHTML,x,y);
            break;
    }
    if (dashSet) _context.setLineDash([]);
}

/**
 *  This function applies any changes to component property
 *  @return nothing
 */

ShapeComponent.prototype.applyProperty = function(_name,_type,_value,_label,_group)
{
    if (_type === "attribute")
    {
        if (!_value)
        {
            this.dom.removeAttribute(_name);
            delete this.param[_name];
        } else {
            this.dom.setAttribute(_name,_value);
            this.param[_name] = _value;
        }
    } else if (_type === "dom")
    {
        this.innerHTML = _value;
        this.dom.innerHTML = "";
        this.dom.appendChild(document.createTextNode(_value));
    }
}

/**
 *  This function is used to update any text. Only applies if component type is text
 *  @param {String} _text
 */
ShapeComponent.prototype.updateText = function(_text)
{
    this.innerHTML = _text;
    this.dom.innerHTML = "";
    this.dom.appendChild(document.createTextNode(_text));
}


/**
 * This Class was originally created to draw extra shapes but it is not used in this version currently
 * @namespace Drawing
 */
var Drawing = {};


/**
 * This Function returns angle between two points
 *  @static
 *  @param {Number} x2
 *  @param {Number} y2
 *  @param {Number} x1
 *  @param {Number} y1
 *  @returns - {Number} angle in radian
 */
Drawing.getLineAngle = function(x2,y2,x1,y1)
{
    return Math.atan2(y2-y1,x2-x1);
}

/**
 * This Function coordinates for arrow head
 *  @static
 *  @param {Number} _x
 *  @param {Number} _y
 *  @param {Number} _angle in radian
 *  @returns - {Object} - containing coodinates {x1,x2,y1,y2}
 */
Drawing.getArrowHead = function(_x,_y,_angle)
{
    var headlen = 10;   // length of head in pixels
    //var angle = Math.atan2(yMid-y1,xMid-x1);

    var x1,x2,y1,y2;
    x1 = _x-headlen*Math.cos(_angle-Math.PI/6);
    y1 = _y-headlen*Math.sin(_angle-Math.PI/6);
    x2 = _x-headlen*Math.cos(_angle+Math.PI/6);
    y2 = _y-headlen*Math.sin(_angle+Math.PI/6);

    return {x1:x1,x2:x2,y1:y1,y2:y2};
}

/**
 * This function creates svg path for a given arrow type
  *  @param - {String} - _place - possible values _start & _end, future value mid
  *  @param - {String} - _arrowType - possible values FILLED, HOLLOW, DOT, REGULAR, DIAMONDFILLED, DIAMONDHOLLOW
  *  @param - {Number} - _angle - angle of the line
  *  @param - {Object} _point - coordinate of point where arrow needs to be drawn
  *  @return - {Array} - return path d Array
 */

Drawing.createArrowPath = function(_place,_arrowType,_angle,_point,_frame)
{
    var d = []; var width = _frame.width; var height = _frame.height;
    var left = _frame.left; var top = _frame.top;
    
    var headlen = 15;
    var x1,x2,y1,y2;

        x1 = _point.x-headlen*Math.cos(_angle-Math.PI/6);
        y1 = _point.y-headlen*Math.sin(_angle-Math.PI/6);
        x2 = _point.x-headlen*Math.cos(_angle+Math.PI/6);
        y2 = _point.y-headlen*Math.sin(_angle+Math.PI/6);

    var arrow = {properties:{}};
    switch (_arrowType)
    {
        case "REGULAR":
            d[0] = {"op":"M",x:(_point.x - left)*100/width,y:(_point.y - top)*100/height};
            d[1] = {"op":"L",x:(x1 - left)*100/width,y:(y1 - top)*100/height};
            d[2] = {"op":"M",x:(_point.x - left)*100/width,y:(_point.y - top)*100/height};
            d[3] = {"op":"L",x:(x2 - left)*100/width,y:(y2 - top)*100/height};
            arrow.type = "path";
            arrow.dimension = {d:d};
            arrow.param = {"fill":"none","stroke":MagicBoard.theme.lineColor,"stroke-miterlimit":"10","stroke-width":2};
            break;
        case "FILLED":
            d[0] = {"op":"M",x:(_point.x - left)*100/width,y:(_point.y - top)*100/height};
            d[1] = {"op":"L",x:(x1 - left)*100/width,y:(y1 - top)*100/height};
            d[2] = {"op":"L",x:(x2 - left)*100/width,y:(y2 - top)*100/height};
            d[3] = {"op":"L",x:(_point.x - left)*100/width,y:(_point.y - top)*100/height};
            d[4] = {"op":"Z"};
            arrow.type = "path";
            arrow.dimension = {d:d};
            arrow.param = {"fill":MagicBoard.theme.arrowFillColor,"stroke":MagicBoard.theme.lineColor,"stroke-miterlimit":"10","stroke-width":2};
            break;
        case "HOLLOW":
            d[0] = {"op":"M",x:(_point.x - left)*100/width,y:(_point.y - top)*100/height};
            d[1] = {"op":"L",x:(x1 - left)*100/width,y:(y1 - top)*100/height};
            d[2] = {"op":"L",x:(x2 - left)*100/width,y:(y2 - top)*100/height};
            d[3] = {"op":"L",x:(_point.x - left)*100/width,y:(_point.y - top)*100/height};
            d[4] = {"op":"Z"};
            arrow.type = "path";
            arrow.dimension = {d:d};
            arrow.param = {"fill":"white","stroke":MagicBoard.theme.lineColor,"stroke-miterlimit":"10","stroke-width":2};
            break;
            
        case "DIAMONDFILLED":
            var y3 = y1 + y2 - _point.y; var x3 = x1 + x2 - _point.x;
            d[0] = {"op":"M",x:(_point.x - left)*100/width,y:(_point.y - top)*100/height};
            d[1] = {"op":"L",x:(x1 - left)*100/width,y:(y1 - top)*100/height};
            d[2] = {"op":"L",x:(x3 - left)*100/width,y:(y3 - top)*100/height};
            d[3] = {"op":"L",x:(x2 - left)*100/width,y:(y2 - top)*100/height};
            d[4] = {"op":"L",x:(_point.x - left)*100/width,y:(_point.y - top)*100/height};
            d[5] = {"op":"Z"};
            arrow.type = "path";
            arrow.dimension = {d:d};
            arrow.param = {"fill":MagicBoard.theme.arrowFillColor,"stroke":MagicBoard.theme.lineColor,"stroke-miterlimit":"10","stroke-width":2};
            break;
            
        case "DIAMONDHOLLOW":
            var y3 = y1 + y2 - _point.y; var x3 = x1 + x2 - _point.x;
            d[0] = {"op":"M",x:(_point.x - left)*100/width,y:(_point.y - top)*100/height};
            d[1] = {"op":"L",x:(x1 - left)*100/width,y:(y1 - top)*100/height};
            d[2] = {"op":"L",x:(x3 - left)*100/width,y:(y3 - top)*100/height};
            d[3] = {"op":"L",x:(x2 - left)*100/width,y:(y2 - top)*100/height};
            d[4] = {"op":"L",x:(_point.x - left)*100/width,y:(_point.y - top)*100/height};
            d[5] = {"op":"Z"};
            arrow.type = "path";
            arrow.dimension = {d:d};
            arrow.param = {"fill":"white","stroke":MagicBoard.theme.lineColor,"stroke-miterlimit":"10","stroke-width":2};
            break;
        case "DOT":
            arrow.type = "circle";
            var radius = 700/width;
            var cx = _point.x-8*Math.cos(_angle);
            
            var cy = _point.y  - 8*Math.sin(_angle);

            arrow.dimension = {"cx":(cx  - left)*100/width,"cy":(cy  - top)*100/height,"r":radius};
            arrow.param = {"fill":MagicBoard.theme.shapeColor,"stroke":MagicBoard.theme.lineColor,"stroke-miterlimit":"10","stroke-width":2};
            break;
    }

    var arrowComponent = new ShapeComponent(arrow);
    return arrowComponent;
}

/**
 * This Function draws arrow head into canvas for a given coordinates
 *  @static
 *  @param {2D_Context} _cntx
 *  @param {Number} _x
 *  @param {Number} _y
 *  @param {Number} _angle
 *  @param {String} _type (type of arrows - Regular, Filled, Hollow, DiamondFilled, DiamondHollow, Dot
 *  @param {Color}  _fillColor
 *  @param {Color}  _strokeColor
 *  @returns - {Object} - containing coordinates {x1,x2,y1,y2}
 */
Drawing.drawArrow = function(_cntx,_x,_y,_angle,_type,_fillColor,_strokeColor)
{
    if (!_type) _type = "Regular";
    if (!_fillColor || _fillColor === "none") _fillColor = "";
    var headlen = 15;   // length of head in pixels
    //var angle = Math.atan2(yMid-y1,xMid-x1);

    var x1,x2,y1,y2;
    x1 = _x-headlen*Math.cos(_angle-Math.PI/6);
    y1 = _y-headlen*Math.sin(_angle-Math.PI/6);
    x2 = _x-headlen*Math.cos(_angle+Math.PI/6);
    y2 = _y-headlen*Math.sin(_angle+Math.PI/6);

    if (_cntx) _cntx.beginPath();
    if (_strokeColor) _cntx.strokeStyle = _strokeColor;
    switch (_type)
    {
        case "Regular":
            _cntx.moveTo(_x, _y);
            _cntx.lineTo(x1,y1);
            _cntx.moveTo(_x, _y);
            _cntx.lineTo(x2,y2);
            break;
        case "Filled":
            _cntx.moveTo(_x, _y);
            _cntx.lineTo(x1,y1);
            _cntx.lineTo(x2,y2);
            _cntx.lineTo(_x, _y);
            if (!_fillColor && _strokeColor) _fillColor = _strokeColor;
            _cntx.fillStyle = _fillColor;
            _cntx.fill();
            break;
        case "Hollow":
            _cntx.moveTo(_x, _y);
            _cntx.lineTo(x1,y1);
            _cntx.lineTo(x2,y2);
            _cntx.lineTo(_x, _y);
            break;
        case "DiamondFilled":
            var y3 = y1 + y2 - _y; var x3 = x1 + x2 - _x;
            _cntx.moveTo(_x, _y);
            _cntx.lineTo(x1,y1);
            _cntx.lineTo(x3,y3);
            _cntx.lineTo(x2,y2);
            _cntx.lineTo(_x, _y);
            if (!_fillColor && _strokeColor) _fillColor = _strokeColor;
            _cntx.fillStyle = _fillColor;
            _cntx.fill();
            break;
        case "DiamondHollow": // to be done later
            var y3 = y1 + y2 - _y; var x3 = x1 + x2 - _x;
            _cntx.moveTo(_x, _y);
            _cntx.lineTo(x1,y1);
            _cntx.lineTo(x3,y3);
            _cntx.lineTo(x2,y2);
            _cntx.lineTo(_x, _y);
            break;
        case "Dot": // to be done later
            var cx = _x - 5*Math.cos(_angle), cy = _y - 5*Math.sin(_angle),r = 5;

            _cntx.arc(cx,cy,r,0,2*Math.PI);
            if (!_fillColor && _strokeColor) _fillColor = _strokeColor;
            _cntx.fillStyle = _fillColor;
            _cntx.fill();
            break;
    }


    _cntx.stroke();

    return {x1:x1,x2:x2,y1:y1,y2:y2};
}


/**
 * This Function draws rounded corner rectangle into canvas context
 *  @static
 *  @param {2D_Context} cntx
 *  @param {Number} x
 *  @param {Number} y
 *  @param {Number} width
 *  @param {Number} height
 *  @param {Number} radius
 *  @param {Color} fill
 *  @param {Color} stroke
 *  @returns - nothing
 */
Drawing.roundRect = function(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke == 'undefined') {
        stroke = true;
    }
    if (typeof radius === 'undefined') {
        radius = 5;
    }
    if (typeof radius === 'number') {
        radius = {tl: radius, tr: radius, br: radius, bl: radius};
    } else {
        var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
        for (var side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }

}

/**
 * This Function draws ellipse into canvas context
 *  @static
 *  @param {2D_Context} _ctx
 *  @param {Number} _cx center of ellipse
 *  @param {Number} _cy center of ellipse
 *  @param {Number} _rx x radius of ellipse
 *  @param {Number} _ry y radius of ellipse
 *  @param {Color} _fill
 *  @param {Color} _stroke
 *  @returns - nothing
 */
Drawing.drawEllipse = function(_ctx, _cx , _cy , _rx , _ry, _fill, _stroke ) {
    var x = _cx - _rx;
    var y = _cy - _ry;
    var w = _rx * 2;
    var h = _ry * 2;

    var kappa = .5522848,
        ox = _rx * kappa, // control point offset horizontal
        oy = _ry * kappa, // control point offset vertical
        xe = x + w,           // x-end
        ye = y + h;           // y-end


    _ctx.beginPath();
    _ctx.moveTo(x, _cy);
    _ctx.bezierCurveTo(x, _cy - oy, _cx - ox, y, _cx, y);
    _ctx.bezierCurveTo(_cx + ox, y, xe, _cy - oy, xe, _cy);
    _ctx.bezierCurveTo(xe, _cy + oy, _cx + ox, ye, _cx, ye);
    _ctx.bezierCurveTo(_cx - ox, ye, x, _cy + oy, x, _cy);
    //ctx.closePath(); // not used correctly, see comments (use to close off open path)
    if (_fill) {
        _ctx.fillStyle = _fill;
        _ctx.fill();
    }
    if (_stroke) {
        _ctx.strokeStyle = _stroke;
    }
    _ctx.stroke();
}

/**
 * This Function draws multiple lines into canvas context
 *  @static
 *  @param {2D_Context} _ctx
 *  @param  {Number} _offsetX - offset any X coordinate by this number
 *  @param  {Number} _offsetY - offset any Y coordinate by this number
 *  @param {String} _d contains d parameter as used in SVG Path
 *  @param {Color} _fill
 *  @param {Color} _stroke
 *  @returns - nothing
 */
Drawing.drawLines = function(_ctx,_offsetX,_offsetY,_d,_fill,_stroke)
{
    _ctx.beginPath();

    if (_stroke) {
        _ctx.strokeStyle = _stroke;
    }
    var words = _d.split(" ");
    for (var w = 0, wLen = words.length;w < wLen;w++)
    {
        var letter = words[w++];
        switch (letter)
        {
            case "M":
                var x = parseInt(words[w++])+_offsetX, y = parseInt(words[w])+_offsetY;
                _ctx.moveTo(x,y);
                break;
            case "L":
                var x = parseInt(words[w++])+_offsetX, y = parseInt(words[w])+_offsetY;
                _ctx.lineTo(x,y);
                break;
        }

    }
    if (_fill) {
        _ctx.fillStyle = _fill;
        _ctx.fill();
    }
    _ctx.stroke();
}


// --- base.js ends here

// Global Mouse Events
document.addEventListener("dragstart", function( event ) {
    if (event.target.nodeType === 3)
    {
        event.preventDefault();
        event.stopPropagation();
    }
}, false);


/**  @namespace MagicBoard **/

/**
 *  This function is used to trap any mouse start event
 *  @param {Event} e
 */
MagicBoard.eventStart = function(e)
{
    var name = e.target.getAttribute("name");
    if (!name) return;
    MagicBoard.indicators.mouseDown = true;

    var pos = MagicBoard.getPos(e);
    MagicBoard.indicators.click = pos; var mLen = MagicBoard.indicators.mouseover.length;
    if (!MagicBoard.indicators.hilight && mLen > 0)
    {
        mLen--;
        var beginShape = MagicBoard.indicators.mouseover[mLen];
        while (beginShape.parentShape)
        {
            var sh  = MagicBoard.indicators.mouseover[mLen--];
            if (sh) beginShape = sh;
            else break;
        }
        
        MagicBoard.indicators.lineActive = beginShape;
        // start drawing arrow
        var ctx = MagicBoard.sheetBook.scratchCtx;
        var canvas = MagicBoard.sheetBook.scratchCanvas
        ctx.clearRect(0,0,canvas.width,canvas.height);
        
        ctx.beginPath();
        ctx.strokeStyle = "gray";
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.moveTo(pos.x,pos.y);
        MagicBoard.scratch.path = [pos];
        
        //console.log("start b-"+beginShape.id);
    } else
    {
        /*
         if (MagicBoard.indicators.resize > -1)
         {
         //_sheetBook.stretcher.
         var shape = MagicBoard.indicators.hilight;
         var stretcher = MagicBoard.sheetBook.stretcher;
         var sStyle = stretcher.style; sStyle.width = shape.dimension.width; sStyle.height = shape.dimension.height;sStyle.visibility = "visible";
         var sCanvas = shape.dom.firstElementChild;
         sCanvas.style.visibility = "hidden";
         stretcher.src = sCanvas.toDataURL();
         shape.dom.appendChild(stretcher);

         }
         */
    }
    MagicBoard.indicators.doubleClick++;
    setTimeout(function() {MagicBoard.indicators.doubleClick--;},400) ; // turn off doubleclick;
}

/**
 *  This function is used to trap any mouse down continuation event
 *  @param {Event} e
 */
MagicBoard.eventContinue = function(e)
{
    if (MagicBoard.indicators.mouseDown)
    {
        var clickPos = MagicBoard.indicators.click;
        var shape = null;
        var pos = MagicBoard.getPos(e);
        shape = MagicBoard.indicators.hilight;
        if (shape)
        {
            if (MagicBoard.indicators.resize > -1)
            {
                shape.resizeContinue(pos,clickPos);
                MagicBoard.indicators.resizeStarted = pos;
            } else
            {
                MagicBoard.indicators.moveStarted = pos;
                shape.move(pos,clickPos);
            }
        } else
        {
            shape = MagicBoard.indicators.lineActive;
            if (shape)
            {
                shape.lineTo(pos);
                MagicBoard.scratch.path.push(pos);
            }
        }
    }
}

/**
 *  This function is used to trap any mouse movement stop event
 *  @param {Event} e
 */
MagicBoard.eventStop = function(e)
{
    if (!MagicBoard.indicators.mouseDown) return;
    MagicBoard.indicators.mouseDown = false;
    if (MagicBoard.indicators.moveStarted)
    {
        // reposition the shape here
        var shape = MagicBoard.indicators.hilight;

        var pos = MagicBoard.indicators.moveStarted; var clickPos = MagicBoard.indicators.click;
        var dim = shape.getDimension();

        var diffX = pos.x - clickPos.x;var diffY = pos.y - clickPos.y;

        var top,left;
        if (MagicBoard.scratch.prevAlign)
        {
            if (MagicBoard.scratch.prevAlign.left) left = MagicBoard.scratch.prevAlign.left;
            if (MagicBoard.scratch.prevAlign.top) top = MagicBoard.scratch.prevAlign.top;
            if (MagicBoard.scratch.prevAlign.right) {
                if (!MagicBoard.scratch.prevAlign.left)
                {
                    var diff = MagicBoard.scratch.prevAlign.right - dim.right;
                    left = dim.left + diff;
                }
            }
            if (MagicBoard.scratch.prevAlign.bottom) {
                if (!MagicBoard.scratch.prevAlign.top)
                {
                    var diff = MagicBoard.scratch.prevAlign.bottom - dim.bottom;
                    top = dim.top + diff;
                }
            }
        }
        if (!left) left = dim.left + diffX;
        if (!top) top = dim.top + diffY;


        shape.setPosition({"x":left,"y":top,"diffX":diffX,"diffY":diffY});

        MagicBoard.indicators.moveStarted = null;
        shape.selectToggle();
    } else
    {
        var mLen = MagicBoard.indicators.mouseover.length; //console.log("event stop "+mLen);
        if ( mLen > 0)
        {
            // it could be single click
            mLen--;
            var endShape = MagicBoard.indicators.mouseover[mLen];
            while (endShape.parentShape)
            {
                var sh  = MagicBoard.indicators.mouseover[mLen--];
                if (sh) endShape = sh;
                else break;
            }
            var beginShape = MagicBoard.indicators.lineActive;

            //console.log("stop b-"+beginShape.id);
            //console.log("stop e-"+endShape.id);

            if (MagicBoard.indicators.resize > -1)
            {
                var shape = MagicBoard.indicators.hilight;
                shape.resizeStop();
                MagicBoard.scratch.path = [];
            }
            else if ( !beginShape || beginShape === endShape || beginShape === endShape.parentShape)
            {
                if (MagicBoard.scratch.connectToSame)
                {
                    beginShape.connectTo(endShape); // connect to itself
                    delete MagicBoard.scratch["connectToSame"];
                } else
                {
                    endShape.click();
                    MagicBoard.scratch.path = [];
                }

            }
            else
            {
                beginShape.connectTo(endShape);
            }
        } else if (MagicBoard.indicators.lineActive)
        {
            Utility.SheetBook.clearScratchCanvas();
        } else if (MagicBoard.indicators.resize > -1)
        {
            shape = MagicBoard.indicators.hilight;
            shape.resizeStop();
        }

    }
    
    MagicBoard.indicators.lineActive = null;
    MagicBoard.indicators.click = null;
    if (MagicBoard.indicators.doubleClick > 1)
    {
        var mLen = MagicBoard.indicators.mouseover.length;
        if ( mLen > 0)
        {
            for (var m = 0 ; m < mLen;m++ )
            {
                var shape = MagicBoard.indicators.mouseover[m];
                shape.doubleClick();
            }

        }
    }
}

/**
 *  This function is used to trap a few keys such as "delete", control+z etc.
 *  @param {Event} e
 */
MagicBoard.keyUp = function(e)
{
    // check to see if it is delete key
    var keycode = e.which;
    if (e.ctrlKey)
        MagicBoard.indicators.keyType = "ctrlKey";
    else if (e.shiftKey)
        MagicBoard.indicators.keyType = "shiftKey";

    switch (keycode)
    {
       // case 8: // backspace
        case 46: // delete
            // delete selected object
            if (MagicBoard.indicators.hilight)
            {
                var shape = MagicBoard.indicators.hilight;
                shape.click(); // force a click to remove hilight
                shape.deleteShape(); // then delete the shape
            }
            break;
        case 67:  // C
        case 99: // c
            if (MagicBoard.indicators.keyType === "ctrlKey")
            {
                if (!MagicBoard.scratch.copy) MagicBoard.scratch.copy = [];
                MagicBoard.scratch.copy.push(MagicBoard.indicators.hilight)
            }
            break;
        case 86:  // V
        case 118: // v
            if (MagicBoard.indicators.keyType === "ctrlKey")
            {
                if (MagicBoard.scratch.copy)
                {
                    // paste all the copied objects
                    for (var c = MagicBoard.scratch.copy.length - 1;c > -1;c-- )
                    {
                        var shape = MagicBoard.scratch.copy[c];
                        var shapeDetail = shape.getShapeDetail();
                        var cloneShape = new Shape(shapeDetail);
                        cloneShape.draw();
                        cloneShape.setPosition({x:(shape.dimension.right+20),y:shape.dimension.top});
                    }
                }
            }
            break;
        case 90:  // z
        case 122: // Z
            if (MagicBoard.indicators.keyType === "ctrlKey")
                MagicBoard.sheetBook.currentSheet.undo();
            break;
        default:
            return;
    }

}

/**
 *  This function is used to trap any mouse position
 *  @param {Event} e
 *  @return {Point} pos
 */
MagicBoard.getPos = function(e) {
    var x; var xOff = 0;
    var y; var yOff = 0;


    if (e.pageX || e.pageY) {
        x = e.pageX - document.body.scrollLeft;
        y = e.pageY - document.body.scrollTop;
    }
    else {

        x = e.clientX + document.body.scrollLeft +
            document.documentElement.scrollLeft;
        y = e.clientY + document.body.scrollTop +
            document.documentElement.scrollTop;
    }

    x = (x - xOff - MagicBoard.boardPos.x) * MagicBoard.sheetBook.zoomCompensate;
    y = (y-yOff - MagicBoard.boardPos.y) * MagicBoard.sheetBook.zoomCompensate;
    return {x: x, y:y};
}
/** @namespace Utility **/
var Utility = {"Shape":{},"Sheet":{},"SheetBook":{}};

/**
 *  This Utility function is for internal use
 *  @static
 *  @param {SheetBook} _sheetBook
 */
Utility.SheetBook.clearScratchCanvas = function()
{
// clear scratch canvas
var ctx = MagicBoard.sheetBook.scratchCtx;
var canvas = MagicBoard.sheetBook.scratchCanvas
ctx.clearRect(0,0,canvas.width,canvas.height);
}
/**
 *  This Utility function is for internal use
 *  @static
 *  @param {SheetBook} _sheetBook
 */
Utility.SheetBook.createWorkItems = function(_sheetBook)
{

    _sheetBook.connectCanvas = document.createElement("canvas");_sheetBook.connectCanvas.setAttribute("style","position:absolute;left:0px;top:0px;z-index:1;"); this.connectCtx = null;
    _sheetBook.connectCanvas.setAttribute("name","workItem");
    _sheetBook.connectCanvas.height = _sheetBook.cheight; _sheetBook.connectCanvas.width = _sheetBook.cwidth;
    //this.anchor.appendChild(this.connectCanvas);
    _sheetBook.connectCtx = _sheetBook.connectCanvas.getContext("2d");
    _sheetBook.connectCtx.translate(0.5,0.5);


    _sheetBook.scratchCanvas = document.createElement("canvas");_sheetBook.scratchCanvas.setAttribute("style","position:absolute;left:0px;top:0px;z-index:1;"); _sheetBook.scratchCtx = null;
    _sheetBook.scratchCanvas.setAttribute("name","workItem");
    // work on the canvas
    _sheetBook.scratchCanvas.height = _sheetBook.cheight; _sheetBook.scratchCanvas.width = _sheetBook.cwidth;
    //this.anchor.appendChild(this.scratchCanvas);
    _sheetBook.scratchCtx = _sheetBook.scratchCanvas.getContext("2d");
    _sheetBook.scratchCtx.translate(0.5,0.5);

    /*
     _sheetBook.hilighter = document.createElementNS("http://www.w3.org/2000/svg", "svg");
     var rect = "<rect x=\"5\" y=\"5\" width=\"120\" height=\"80\" fill-opacity=\"0\" style=\"stroke-width:5;stroke:rgb(27,141,17)\" ></rect>";
     _sheetBook.hilighter.innerHTML = rect;
     _sheetBook.hilighter.setAttribute("style","visibility:hidden;height:"+_sheetBook.cheight+"px;width:"+_sheetBook.cwidth+"px;z-index:10;");
     _sheetBook.hilighter.setAttribute("name","workItem");
     */
    _sheetBook.hilighter = document.createElement("div");
    _sheetBook.hilighter.setAttribute("style","visibility:hidden;height:100px;width:100px;left:0px;top:0px;z-index:10");
    _sheetBook.hilighter.setAttribute("class","hilight");
    _sheetBook.hilighter.setAttribute("name","workItem");
    _sheetBook.hilighter.onmouseover = function()
    {
        if (MagicBoard.indicators.hilight)
            MagicBoard.indicators.mouseover.push(MagicBoard.indicators.hilight); // push the hilighted shape
    }

    _sheetBook.hilighter.onmouseout = function () {
        event.preventDefault();
        MagicBoard.indicators.mouseover = [];
    }

    _sheetBook.hilighter.innerHTML = "<div class='stretcher' name='workItem'><div class='red' name='workItem'></div></div>" +
        "<div class='stretcher name='workItem''><div class='red' name='workItem'></div></div>" +
        "<div class='stretcher' name='workItem'><div class='red' name='workItem'></div></div>" +
        "<div class='stretcher' name='workItem'><div class='red' name='workItem'></div></div>" +
        "<div class='stretcher' name='workItem'><div class='corner' name='workItem'></div></div>" +
        "<div class='stretcher' name='workItem'><div class='corner' name='workItem'></div></div>" +
        "<div class='stretcher' name='workItem'><div class='corner' name='workItem'></div></div>" +
        "<div class='stretcher' name='workItem'><div class='corner' name='workItem'></div></div>"
        /*+
    "<div class='clickPrompt' onclick='Utility.Shape.showProperty()'></div>"
    */
    ;


    var children = _sheetBook.hilighter.children;

    var mOut = function() {
        if (! MagicBoard.indicators.mouseDown) MagicBoard.indicators.resize = -1;
    }
    children[0].onmouseover = function() {if (! MagicBoard.indicators.mouseDown) MagicBoard.indicators.resize = 0;}
    children[0].onmouseout = mOut;
    children[1].onmouseover = function() {if (! MagicBoard.indicators.mouseDown) MagicBoard.indicators.resize = 1;}
    children[1].onmouseout = mOut;
    children[2].onmouseover = function() {if (! MagicBoard.indicators.mouseDown) MagicBoard.indicators.resize = 2;}
    children[2].onmouseout = mOut;
    children[3].onmouseover = function() {if (! MagicBoard.indicators.mouseDown) MagicBoard.indicators.resize = 3;}
    children[3].onmouseout = mOut;
    children[4].onmouseover = function() {if (! MagicBoard.indicators.mouseDown) MagicBoard.indicators.resize = 4;}
    children[4].onmouseout = mOut;
    children[5].onmouseover = function() {if (! MagicBoard.indicators.mouseDown) MagicBoard.indicators.resize = 5;}
    children[5].onmouseout = mOut;
    children[6].onmouseover = function() {if (! MagicBoard.indicators.mouseDown) MagicBoard.indicators.resize = 6;}
    children[6].onmouseout = mOut;
    children[7].onmouseover = function() {if (! MagicBoard.indicators.mouseDown) MagicBoard.indicators.resize = 7;}
    children[7].onmouseout = mOut;

    _sheetBook.textEditor = document.createElement("div");
    _sheetBook.textEditor.setAttribute("contenteditable","true");
    _sheetBook.textEditor.setAttribute("style","position:absolute;left:0px;top:0px;width:10px;height:14px;display:none;background:white;z-index:100");
    document.body.appendChild(_sheetBook.textEditor);
    _sheetBook.textEditor.onblur = function()
    {
        _sheetBook.textEditor.style.display = "none";
        var targetShape = _sheetBook.textEditor.targetShape;
        targetShape.updateText(_sheetBook.textEditor.innerHTML);
        /*
         var owner = Utility.Sheet.findOwner(target);
         owner.innerHTML = _sheetBook.textEditor.innerHTML;
         target.innerHTML = _sheetBook.textEditor.innerHTML;
         */
        targetShape.selectToggle(); // remove any hilites
        _sheetBook.textEditor.targetShape = null;
    }

    // create mouseover star
    _sheetBook.star = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    _sheetBook.star.setAttribute("style","display:none;position:absolute;left:0px;top:0px;z-index:10;width:50px;height:21px");
    _sheetBook.star.innerHTML = "<polygon points=\"10,1 4,20 19,8 1,8 16,20\" style=\"fill:red;stroke:red;stroke-width:1;fill-rule:nonzero;\" />";

    _sheetBook.star.onclick = function()
    {
        var cLine = _sheetBook.star.cLine;
        if (cLine)
        {
            cLine.click();
        }
    }

    // attach it to the anchor
    Utility.SheetBook.attachWorkItems(_sheetBook);
    /*
     //this.anchor.appendChild(this.hilighter);

     _sheetBook.stretcher = document.createElement("img");
     _sheetBook.stretcher.setAttribute("style","z-index:10;position:absolute;left:0px;top:0px;height:100px;width:100px;visibility:hidden");
     _sheetBook.stretcher.setAttribute("name","workItem");
     */

}

/**
 *  This Utility function is for internal use
 *  @static
 *  @param {SheetBook} _sheetBook
 */
Utility.SheetBook.attachWorkItems = function(_sheetBook)
{
    //var sheetBook = MagicBoard.sheetBook;
    //var sheetCanvas = _sheet.canvas;
    sheetCanvas = _sheetBook.anchor;
    sheetCanvas.appendChild(_sheetBook.scratchCanvas);
    sheetCanvas.appendChild(_sheetBook.connectCanvas);
    sheetCanvas.appendChild(_sheetBook.hilighter);
    sheetCanvas.appendChild(_sheetBook.star);
}

/**
 *  This Utility function is for activating hilighter around a shape
 *  @static
 *  @param {Object} _dimension
 *  @param {Shape} _shape - shape to be hilighted;
 */
Utility.SheetBook.activateHilighter = function(_dimension,_shape)
{
    var hilighter = MagicBoard.sheetBook.hilighter;
    hilighter.style["visibility"] = "visible";
    Utility.SheetBook.resizeHilighter(_dimension,_shape);
}

/**
 *  This Utility function is for resizing hilighter around a shape during resize event
 *  @static
 *  @param {Object} _dimension
 *  @param {Shape} _shape - shape to be hilighted;
 */
Utility.SheetBook.resizeHilighter = function(_dimension,_shape)
{
    var hilighter = MagicBoard.sheetBook.hilighter;
    var x = _dimension.left - 4; var y = _dimension.top - 4;
    var w = _dimension.width + 8; var h = _dimension.height + 8;

    hilighter.style.left = x +"px";hilighter.style.top = y +"px";
    hilighter.style.width = w +"px";hilighter.style.height = h+"px";
    var children = hilighter.children;
    var s1 = children[0].style; s1.left = "-12px"; s1.top = (h/2 - 12)+"px";s1.cursor = "ew-resize";
    var s2 = children[1].style; s2.left = (w-14)+"px"; s2.top = (h/2 - 12)+"px";s2.cursor = "ew-resize";
    var s3 = children[2].style; s3.left = (w/2 - 12)+"px"; s3.top = "-12px";s3.cursor = "ns-resize";
    var s4 = children[3].style; s4.left = (w/2 - 12)+"px"; s4.top = (h - 14)+"px";s4.cursor = "ns-resize";

    var c1 = children[4].style; c1.left = "-12px"; c1.top = "-12px";c1.cursor = "nw-resize";
    var c2 = children[5].style; c2.left = "-12px"; c2.top = (h - 14)+"px";c2.cursor = "sw-resize";
    var c3 = children[6].style; c3.left = (w - 12)+"px"; c3.top = "-12px";c3.cursor = "ne-resize";
    var c4 = children[7].style; c4.left = (w - 12)+"px"; c4.top = (h - 14)+"px";c4.cursor = "nw-resize";
}

/**
 *  This Utility function creates new Sheet from svg String
 *  @static
 *  @param {String} _name - name of the new Sheet
 *  @param {String} _svg - String containing svg
 *  @return - nothing
 */
Utility.SheetBook.createSheet = function(_name,_svg)
{
    var obj = {"name":_name,"shapes":[]};
    var garbage = MagicBoard.sheetBook.garbage;
    garbage.innerHTML = _svg; var svgElement = garbage.children;
    

    var components = [];
    var shapeJson = Utility.createShapeJson1(svgElement[0],obj.shapes,components,0); // svg.children = garbage.children.children
    obj.shapes.push(shapeJson);
    var sheet1 = new Sheet(obj);
    MagicBoard.sheetBook.addSheet(sheet1);
    MagicBoard.sheetBook.setCurrentSheet(sheet1);
    
    garbage.innerHTML = ""; // clear gargabe
    return sheet1;
}
Utility.supportedNodes = {"g":true,"rect":true,"circle":true,"ellipse":true,"path":true,"text":true};
Utility.createShapeJson1 = function(parent,shapeArray,components,level)
{
   
        for (var c = 0, cLen = parent.children.length; c < cLen ; c++)
        {
            var child = parent.children[c];
            var nodeName = child.nodeName;
            if (!Utility.supportedNodes[nodeName]) continue;
            if (nodeName === "g") {
                if (components.length > 0)
                {
                    var shapeJson = Utility.createShapeJson2(components);
                    shapeArray.push(shapeJson);
                }
                // handle any transform here (translate could be multi-level)
                components = [];
                Utility.temp = {minX:99999,maxX:0,minY:99999,maxY:0};
                Utility.createShapeJson1(child,shapeArray,components,(level+1));//getShapes(child,shapeArray);
            }
            else
            {
                var component = {type:null,origDim:{},dimension:{},param:{},lines:[]}; //{type:"rect",dimension:{width:100,height:100,x:0,y:0},param:{"fill":"none","stroke-width":1,"stroke":"black","border-radius":8}};
                component.type = nodeName;
                
                for (var att, i = 0, atts = child.attributes, n = atts.length; i < n; i++){
                    att = atts[i];
                    switch (att.nodeName)
                    {
                        case "x": {var x = parseInt(att.nodeValue);component.origDim["x"] = x ;if (x < Utility.temp.minX) Utility.temp.minX = x ; if (x > Utility.temp.maxX) Utility.temp.maxX = x;break;}
                        case "y": {var y = parseInt(att.nodeValue);component.origDim["y"] = y ;if (y < Utility.temp.minY) Utility.temp.minY = y ; if (y > Utility.temp.maxY) Utility.temp.maxY = y;break;}
                        case "r": component.origDim["r"] = parseInt(att.nodeValue);break;
                        case "cx": component.origDim["cx"] = parseInt(att.nodeValue);break;
                        case "cy": component.origDim["cy"] = parseInt(att.nodeValue);break;
                        case "rx": component.origDim["rx"] = parseFloat(att.nodeValue);break;
                        case "ry": component.origDim["ry"] = parseFloat(att.nodeValue);break;
                        case "width": component.origDim["width"] = parseInt(att.nodeValue);break;
                        case "height": component.origDim["height"] = parseInt(att.nodeValue);break;
                        case "d": {
                            component.lines = Utility.parseD(att.nodeValue);
                            break;
                        }
                        default: component.param[att.nodeName] = att.nodeValue;break;
                    }
                    
                }
                //
                
                var dimension = component.origDim;
                if (component.type === "ellipse")
                {
                    var x = dimension.cx - dimension.rx; x = parseInt(x.toFixed(0));
                    var y = dimension.cy - dimension.ry; y = parseInt(y.toFixed(0));
                    var x1 = dimension.cx + dimension.rx;
                    var y1 = dimension.cy + dimension.ry;
                    if (x < Utility.temp.minX) {Utility.temp.minX = x ;} if (x > Utility.temp.maxX) Utility.temp.maxX = x;
                    if (y < Utility.temp.minY) {Utility.temp.minY = y ;} if (y > Utility.temp.maxY) Utility.temp.maxY = y;
                    if (x1 < Utility.temp.minX) Utility.temp.minX = x1 ; if (x1 > Utility.temp.maxX) Utility.temp.maxX = x1;
                    if (y1 < Utility.temp.minY) Utility.temp.minY = y1 ; if (y1 > Utility.temp.maxY) Utility.temp.maxY = y1;
                } else if (component.type === "circle")
                {
                    var x = dimension.cx - dimension.r;x = parseInt(x.toFixed(0));
                    var y = dimension.cy - dimension.r;y = parseInt(y.toFixed(0));
                    var x1 = dimension.cx + dimension.r;
                    var y1 = dimension.cy + dimension.r;
                    if (x < Utility.temp.minX) {Utility.temp.minX = x ;} if (x > Utility.temp.maxX) Utility.temp.maxX = x;
                    if (y < Utility.temp.minY) {Utility.temp.minY = y ;} if (y > Utility.temp.maxY) Utility.temp.maxY = y;
                    if (x1 < Utility.temp.minX) Utility.temp.minX = x1 ; if (x1 > Utility.temp.maxX) Utility.temp.maxX = x1;
                    if (y1 < Utility.temp.minY) Utility.temp.minY = y1 ; if (y1 > Utility.temp.maxY) Utility.temp.maxY = y1;
                } else if (component.type === "rect")
                {
                    var x = dimension.x;
                    var y = dimension.y;
                    var x1 = dimension.x + dimension.width;
                    var y1 = dimension.y + dimension.height;
                    if (x < Utility.temp.minX) {Utility.temp.minX = x ;} if (x > Utility.temp.maxX) Utility.temp.maxX = x;
                    if (y < Utility.temp.minY) {Utility.temp.minY = y ;} if (y > Utility.temp.maxY) Utility.temp.maxY = y;
                    if (x1 < Utility.temp.minX) Utility.temp.minX = x1 ; if (x1 > Utility.temp.maxX) Utility.temp.maxX = x1;
                    if (y1 < Utility.temp.minY) Utility.temp.minY = y1 ; if (y1 > Utility.temp.maxY) Utility.temp.maxY = y1;
                } else if (component.type === "text")
                {
                    component.innerHTML = child.textContent;
                }
                //
                components.push(component);
                
            }
        }
    
    if (level === 0)
    {
        if (components.length > 0)
        {
            var shapeJson = Utility.createShapeJson2(components);
            return shapeJson;
        }
    }
}

Utility.createShapeJson2 = function(_components)
{
    var swidth = Utility.temp.maxX - Utility.temp.minX; var sheight = Utility.temp.maxY - Utility.temp.minY;
    
    var sh =  {
    frame:{width:swidth,height:sheight,unit:"px",left:Utility.temp.minX,top:Utility.temp.minY},
    param:{alignmentRails:true},
    componentParms:[]
    }
    
    for (var c = 0,cLen = _components.length; c < cLen;c++)
    {
        var _component = _components[c];
        var _dimension = _component.origDim;
        var perDim = _component.dimension;
        for (var k in _dimension)
        {
            switch (k)
            {
                case "x": _dimension.x = _dimension.x - Utility.temp.minX; perDim.x = _dimension.x*100/swidth; break;
                case "y": _dimension.y = _dimension.y - Utility.temp.minY; perDim.y = _dimension.y*100/sheight;break;
                case "cx": _dimension.cx = _dimension.cx - Utility.temp.minX;perDim.cx = _dimension.cx*100/swidth; break;
                case "cy": _dimension.cy = _dimension.cy - Utility.temp.minY; perDim.cy = _dimension.cy*100/sheight;break;
                case "r": perDim.r = _dimension.r*100/swidth; break;
                case "rx":  perDim.rx = _dimension.rx*100/swidth; break;
                case "ry":  perDim.ry = _dimension.ry*100/sheight;break;
                case "width": perDim.width = _dimension.width*100/swidth; break;
                case "height":  perDim.height = _dimension.height*100/sheight;break;
            }
        }
        
        var _lines = _component.lines;lLen = _lines.length;
        if (lLen) perDim.d = [];
        for (var l = 0;l < lLen;l++)
        {
            var line = _lines[l];
            var perLine = {op:line.op};
            perDim.d.push(perLine);
            
            if (line.op === "Z") continue;
            for (k in line)
            {
                if (k.indexOf("x") > -1)
                {
                    line[k] = line[k] - Utility.temp.minX;
                    perLine[k] = line[k]*100/swidth;
                } else if (k.indexOf("y") > -1)
                {
                    line[k] = line[k] - Utility.temp.minY;
                    perLine[k] = line[k]*100/sheight;
                }
            }
        }
        sh.componentParms.push(_component);
    }
    
    return sh;
}

/**
 * This is an internal function only
 * @static
 */
Utility.parseD = function(_dString)
{
    var seq = [];var seqPrev = [];
    var dArray = _dString.split(" ");
    var line=null; var lines = [];
    for (var d = 0,dLen = dArray.length;d< dLen;d++)
    {
        var data = dArray[d];var op = data.substring(0,1); var coord = false;
        if (!data) continue;
        var opU = op.toUpperCase();
        switch (opU)
        {
            case "A":
                //rx ry x-axis-rotation large-arc-flag sweep-flag x y
                seq = ["rx", "ry", "a1", "lf", "sf","x", "y"];
                seqPrev = ["rx", "ry", "a1", "lf", "sf","x", "y"];
                break;
            case "C":
                seq = ["x1", "y1", "x2", "y2", "x", "y"];
                seqPrev = ["x1", "y1", "x2", "y2", "x", "y"];
                break;
            case "H":
                seq = ["x"];
                seqPrev = ["x"];
                break;
            case "M":
                seq = ["x","y"];
                seqPrev = ["x","y"];
                break;
            case "L":
                seq = ["x","y"];
                seqPrev = ["x","y"];
                break;
            case "Q":
                seq = ["x1", "y1","x","y"];
                seqPrev = ["x1", "y1","x","y"];
                break;
            case "S":
                seq = ["x2", "y2", "x", "y"];
                seqPrev = ["x2", "y2", "x", "y"];
                break;
            case "T":
                seq = ["x","y"];
                seqPrev = ["x","y"];
                break;
            case "V":
                seq = ["y"];
                seqPrev = ["y"];
                break;
            case "Z":
                seq =[];
                seqPrev =[];
                break;
                
            default:
                coord = true;
                data = parseInt(data);
                break;
        }
        
        if (!coord) {
            line = {"op":op};
            lines.push(line);
            if (data.length > 1) {data = parseInt(data.substring(1));coord = true;}
        }
        
        if (coord)
        {
            if (seq.length === 0)
            {
                var sLen = seqPrev.length;
                for (var s=0;s< sLen;s++)
                {
                    seq[s] = seqPrev[s];
                }
            }
            var key = seq[0];
            line[key] = data;
            seq.splice(0,1);
            if (key === "x" || key === "x1" || key === "x2")
            {
                if (data < Utility.temp.minX) Utility.temp.minX = data;
                if (data > Utility.temp.maxX) Utility.temp.maxX = data;
            } else if (key == "y" || key == "y1" || key == "y2")
            {
                if (data < Utility.temp.minY) Utility.temp.minY = data;
                if (data > Utility.temp.maxY) Utility.temp.maxY = data;
            }
        }
        
    }
    return lines;
}
/**
 *  This Utility function is for internal use
 *  @static
 *  @param {Sheet} _sheet
 */
Utility.Sheet.Markers = function(_sheet)
{
    var defString =  "<defs>"
        +"<marker id='fillArrowE' markerWidth='10' markerHeight='10' refx='8' refy='3' orient='auto' markerUnits='strokeWidth' ><path d='M0,0 L0,6 L9,3 Z' fill='rgb(27,141,17)'></path></marker>"
        +"<marker id='fillArrowS' markerWidth='10' markerHeight='10' refx='0' refy='3' orient='auto' markerUnits='strokeWidth' ><path d='M0,3 L9,0 L9,6 Z' fill='rgb(27,141,17)'></path></marker>"
        +"<marker id='hollowArrowE' markerWidth='10' markerHeight='10' refx='8' refy='3' orient='auto' markerUnits='strokeWidth' ><path d='M0,0 L0,6 L9,3 Z' fill='white' stroke='rgb(27,141,17)' stroke-width='1'></path></marker>"
        +"<marker id='hollowArrowS' markerWidth='10' markerHeight='10' refx='0' refy='3' orient='auto' markerUnits='strokeWidth' ><path d='M0,3 L9,0 L9,6 Z' fill='white' stroke='rgb(27,141,17)' stroke-width='1'></path></marker>"
        +"<marker id='hollowDiamond' markerWidth='10' markerHeight='10' refx='0' refy='3' orient='auto' markerUnits='strokeWidth' ><path d='M0,3 L5,0 L10,3 L5,6 Z' fill='white' stroke='rgb(27,141,17)' stroke-width='1'></path></marker>"
        +"<marker id='fillDiamond' markerWidth='10' markerHeight='10' refx='0' refy='3' orient='auto' markerUnits='strokeWidth' ><path d='M0,3 L5,0 L10,3 L5,6 Z' fill='rgb(27,141,17)' ></path></marker>"
        +"<marker id='dot' markerWidth='10' markerHeight='10' refx='0' refy='3' orient='auto' markerUnits='strokeWidth' ><circle r='3' cx='3' cy='3' fill='rgb(27,141,17)' ></circle></marker>"
        +"<marker id='lineArrowE' markerWidth='10' markerHeight='10' refx='8' refy='3' orient='auto' markerUnits='strokeWidth' ><path d='M0,0 L9,3 L0,6' fill='none' stroke='rgb(27,141,17)' stroke-width='1'></path></marker>"
        +"<marker id='lineArrowS' markerWidth='10' markerHeight='10' refx='0' refy='3' orient='auto' markerUnits='strokeWidth' ><path d='M9,0 L0,3 L9,6' fill='none' stroke='rgb(27,141,17)' stroke-width='1'></path></marker>"
        +"</defs>";

    /*
     +"<marker id='startArrow1' markerWidth='10' markerHeight='10' refx='0' refy='3' orient='auto' markerUnits='strokeWidth' >"
     + "<path d='M0,0 L9,-3 L9,3 Z' fill='#000000'></path>"
     + "</marker>"
     */
    _sheet.canvas.innerHTML = defString;

}

/**
 *  This Utility function is for internal use
 *  to figure out if any a portion of the area is already occupied
 *  @static
 */
Utility.Sheet.isGridAvailable = function(startGridSeq,_sheet,_shape)
{

    // temporary code
    //Utility.Sheet.drawCourseGrid(_sheet);

    var dim = _shape.dimension;
    var allGrids = _sheet.courseGrids;
    var gLen = allGrids.length;
    var horizGrids = _sheet.noOfXcourseGrids;
    var vertGrids = _sheet.noOfYcourseGrids;
    var margin = 10;
    var maxWidth = MagicBoard.sheetBook.cwidth;
    var maxHeight = MagicBoard.sheetBook.cheight;

    // prime it for the first time only
    if (startGridSeq === -1)
    {
        var left = 0; var top = 0;
        // give preference to dim.left and dim.top
        if (dim.left) left = dim.left;

        startGridSeq = Utility.Sheet.LeftAlignedFreeGrid(left,top,_sheet);


        for (var g = startGridSeq; g < gLen;g++)
        {
            var grid = allGrids[g];
            if (grid.filled) continue;
            return Utility.Sheet.isGridAvailable(g,_sheet,_shape);
        }
    }

    //  priming complete

    var startGrid = allGrids[startGridSeq];
    var startX = startGrid.x1 + margin;
    var startY = startGrid.y1 + margin;

    var c1 = {x:startX,y:startY};
    var c2 = {x:(startX + dim.width),y:startY};
    if (c2.x > maxWidth)
    {
        return Utility.Sheet.isGridAvailable((startGridSeq+1),_sheet,_shape);
    }
    var c3 = {x:startX,y:(startY+dim.height)};
    if (c3.y > maxHeight)
    {
        return []; // it is full
    }
    var c4 = {x:(startX + dim.width),y:(startY+dim.height)};


    // to be done later if startGrid is bad.. means cannot accomodate rectangle
    // skip through untill you find the right startGrid

    var x = Math.floor(startGridSeq / horizGrids) + 1;
    var y = startGridSeq / horizGrids;

    // find the top right, bottom right, bottom left corner grids
    // make sure all of them are free

    var busyGrids = [];

    for (var iX = startGridSeq; iX < gLen; iX++ )
    {
        var grid = allGrids[iX];
        var x1,x2,y1,y2;
        x1 = grid.x1; x2 = grid.x2; y1 = grid.y1; y2 = grid.y2;

        // possibilities    1. x2 < c1.x  -- outside
        //                  2. x1 > c2.x  -- outside
        //                  3  y2 < c1.y  -- outside
        //                  4  y1 > c3.y  -- outside
        // remaining all are in scope grids

        if (x2 < c1.x) continue;
        if (x1 > c2.x) continue;
        if (y1 > c3.y) break;
        if (y2 < c1.y) continue; // this will never happen, I think, because we are only going forward

        if (grid.filled)
        {
            var iX1 = iX;
            // we got to again start looking
            // call this routine recursively
            // loop through to find first empty grid
            for (; iX1 < gLen; iX1++)
            {
                if (iX1 >=gLen)
                {
                    return []; // all filled;
                }
                if (!allGrids[iX1].filled)
                    break;
            }
            var _busyGrids = Utility.Sheet.isGridAvailable(iX1,_sheet,_shape);
            if (_busyGrids.length > 0) return _busyGrids;
        }

        busyGrids.push(iX);
        continue;
    }
    return busyGrids;
}

/**
 *  This Utility function is for internal use
 *  @static
 */
Utility.Sheet.LeftAlignedFreeGrid = function(left,top,_sheet)
{
    var horizGrids = _sheet.noOfXcourseGrids;
    var allGrids = _sheet.courseGrids;
    startGridSeq = Math.floor(top/_sheet.courseGridSize.y)  * horizGrids + Math.floor(left/_sheet.courseGridSize.x);
    if (startGridSeq > allGrids.length) return 0;

    if (allGrids[startGridSeq].filled)
    {
        // find the next preferred one
        if (left)
        {
            return Utility.Sheet.LeftAlignedFreeGrid(left,(top + _sheet.courseGridSize.y),_sheet);
        } else return startGridSeq++;

    } else return startGridSeq;
}

/**
 *  This Utility function to find owner shape any dom in a sheet
 *  @static
 *  @param {HTMLElement} _dom
 *  @return {ShapeComponent} component or null (if not found)
 */
Utility.Sheet.findOwner = function(_dom)
{
    var _sheet = MagicBoard.sheetBook.currentSheet;
    var sLen = _sheet.shapes.length;
    for (var s = 0; s < sLen;s++)
    {
        var _shape = _sheet.shapes[s];
        if (_shape.dom === _dom) return _shape.dom;
        var cLen = _shape.components.length;
        for (var c = 0; c < cLen ;c++)
        {
            var component = _shape.components[c];
            if (component.dom === _dom) return component;
        }
    }

    return null;
}
/**
 *  This Utility function is for internal use only
 *  @static
 */
Utility.Sheet.connectIds = function()
{
    var _sheet = MagicBoard.sheetBook.currentSheet;
    var sLen = _sheet.shapes.length;
    for (var s = 0; s < sLen;s++)
    {
        var shape = _sheet.shapes[s];
        if (shape.connectedFromIds)
        {
            for (var c = 0, cLen = shape.connectedFromIds.length; c < cLen;c++)
            {
                var bId = shape.connectedFromIds[c];
                // find beginShapes
                shape.connectedFrom.push(Utility.Sheet.findShapeById(bId));
            }
        }
        if (shape.connectedToIds)
        {
            for (var c = 0, cLen = shape.connectedToIds.length; c < cLen;c++)
            {
                var eId = shape.connectedToIds[c];
                // find endShapes
                shape.connectedTo.push(Utility.Sheet.findShapeById(eId));
            }
        }
    }
    for (var s = 0; s < sLen;s++)
    {
        var shape = _sheet.shapes[s];
        shape.refreshConnection();
    }
    //refreshConnection
}

/**
 *  This Utility function is for internal use only
 *  @static
 */
Utility.Sheet.findShapeById = function(_id)
{
    var _sheet = MagicBoard.sheetBook.currentSheet;
    var sLen = _sheet.shapes.length;
    for (var s = 0; s < sLen;s++)
    {
        var shape = _sheet.shapes[s];
        if (shape.id === _id) return shape;
    }
}

Utility.Shape.definePeriferalPoints = function(_dim)
{
    _dim.right = _dim.left + _dim.width;
    _dim.bottom = _dim.top + _dim.height;
    _dim.cx = _dim.left + (_dim.width)/2;
    _dim.cy = _dim.top + (_dim.height)/2;
    
    
    var edgePoints = {
        "c1":{"x":_dim.left,"y":_dim.top},
        "c2":{"x":_dim.right,"y":_dim.top},
        "c3":{"x":_dim.right,"y":_dim.bottom},
        "c4":{"x":_dim.left,"y":_dim.bottom},
        "m12":{"x":_dim.cx,"y":_dim.top},
        "m23":{"x":_dim.right,"y":_dim.cy},
        "m34":{"x":_dim.cx,"y":_dim.bottom},
        "m41":{"x":_dim.left,"y":_dim.cy}
    };
    
    _dim.edgePoints = edgePoints;
}

/**
 *  This Utility function is invoked during resize event.
 *  @param {Shape} _shape
 *  @static
 *  */
Utility.Shape.resize = function(_shape,_diffX,_diffY)
{
    if (!_shape.dimension.resizeX) _shape.dimension.resizeX = _shape.dimension.left;
    if (!_shape.dimension.resizeY) _shape.dimension.resizeY = _shape.dimension.top;
    var x = _shape.dimension.resizeX; var y = _shape.dimension.resizeY;
    var resizePosition = false;
    var resize = MagicBoard.indicators.resize;
    if (resize < 2)
    {
        if (!_shape.dimension.resizeWidth) _shape.dimension.resizeWidth = _shape.dimension.width;

        var w = _shape.dimension.resizeWidth;

        var newW = w;
        if (MagicBoard.indicators.resize === 0) {
            x = x + _diffX;
            newW = w- _diffX;
            resizePosition = true;
        } else newW = w + _diffX;
        _shape.dimension.width = newW;
        _shape.dom.setAttribute("width",newW);
    } else if (resize < 4)
    {
        if (!_shape.dimension.resizeHeight) _shape.dimension.resizeHeight = _shape.dimension.height;
        var h = _shape.dimension.resizeHeight;

        var newH = h;
        if (MagicBoard.indicators.resize === 2) {
            y = y + _diffY;
            newH = h- _diffY;
            resizePosition = true;
        }
        else newH = h+_diffY;

        _shape.dimension.height = newH;
        _shape.dom.setAttribute("height",newH);
    } else
    {
        if (!_shape.dimension.resizeWidth) _shape.dimension.resizeWidth = _shape.dimension.width;
        var w = _shape.dimension.resizeWidth;
        var newW = w;

        if (!_shape.dimension.resizeHeight) _shape.dimension.resizeHeight = _shape.dimension.height;
        var h = _shape.dimension.resizeHeight;
        var newH = h;

        if (resize === 4)
        {
            x = x + _diffX;
            newW = w- _diffX;

            y = y + _diffY;
            newH = h- _diffY;
            resizePosition = true;
        } else if (resize === 5)
        {
            x = x + _diffX;
            newW = w- _diffX;

            newH = h+_diffY;
            resizePosition = true;
        } else if (resize === 6)
        {
            newW = w+ _diffX;

            y = y + _diffY;
            newH = h- _diffY;
            resizePosition = true;
        } else if (resize === 7)
        {
            newW = w+ _diffX;
            newH = h+_diffY;
        }
        _shape.dimension.width = newW;
        _shape.dom.setAttribute("width",newW);
        _shape.dimension.height = newH;
        _shape.dom.setAttribute("height",newH);
    }
    if (resizePosition) _shape.setPosition({x:x,y:y});
    _shape.reDraw();

}
/**
 *  This Utility function to apply changes to internal properties of the shape.
 *  e.g. properties such as "Background Color", "Border Width" etc.
 *  @static
 */
Utility.Shape.applyProperty = function()
{
    var propPrompt = document.getElementById("propPrompt");
    var shape = propPrompt.shape;
    propPrompt.shape = null;

    var inps = propPrompt.getElementsByClassName("prop");
    var iLen = inps.length;
    for (var i = 0; i < iLen;i++)
    {
        var field = inps[i];
        var dirty = field.getAttribute("data-dirty");
        if (dirty && dirty === "1")
        {
            var propKey = field.getAttribute("data-propKey");
            var propType = field.getAttribute("data-propType");
            var propName = field.getAttribute("data-propName");
            var val;
            if (field.nodeName === "INPUT") val = field.value;
            else if (field.nodeName === "SELECT") val = field.options[field.selectedIndex].value;

            shape.applyProperty(propKey,propName,propType,val);
        }

    }

    Utility.destroyDom(propPrompt,"dom");

}

/**
 *  This Utility function is for internal use only
 *  @static
 */
Utility.addChangeFlag = function()
{
    var target = event.target;
    target.setAttribute("data-dirty","1");
}

/**
 *  This Utility function to show internal properties of the shape for possible modifications.
 *  e.g. properties such as "Background Color", "Border Width" etc.
 *  @static
 */
Utility.Shape.showProperty = function()
{
    var disp = "";
    var shape = MagicBoard.indicators.hilight;
    var properties = shape.properties;
    var pLen = properties.length;
    for (var p in properties)
    {
        var pDetail = MagicBoard.properties[p];
        //{"attribute":"fill","label":"Background Color","field":"input","values":[{"name":"","value":MagicBoard.theme.shapeColor,"type":"color"}]}
        if (pDetail.field === "input")
        {
            disp += "<label class='propLabel'>"+pDetail.label+":</label><input class='propInput prop' data-propKey='"+p+"' class='prop' data-propType='"+pDetail.propType+"'  data-propName='"+pDetail.propName+"' type='"+pDetail.values[0].type+"' value='"+pDetail.values[0].value+"' onchange='Utility.addChangeFlag()'/><BR/>";
        } else if (pDetail.field === "select")
        {
            disp += "<label class='propLabel' >"+pDetail.label+":</label><select onchange='Utility.addChangeFlag()' data-propKey='"+p+"' class='prop' data-propType='"+pDetail.propType+"'  data-propName='"+pDetail.propName+"'  >";
            for (var v = 0, vLen = pDetail.values.length; v < vLen;v++)
            {
                disp += "<option value='"+pDetail.values[v].value+"' >"+pDetail.values[v].name+"</option>";
            }
            disp += "</select><BR/>";
        }
    }

    if (disp)
    {
        disp += "<br/><button class='apply button' onclick='Utility.Shape.applyProperty()'>Apply</button><button class='cancel button' onclick='Utility.destroyDom(\"propPrompt\",\"id\")'>Cancel</button>"
        var div = document.createElement("div");
        div.setAttribute("class","prompt");
        div.setAttribute("style","");
        div.setAttribute("id","propPrompt");
        div.innerHTML = disp;
        div.shape = shape;
        document.body.appendChild(div);
    }
}

/**
 * this function is for internal use to show nearest aligned horizontal and vertical lines
 * sample structure for internal use only
 * MagicBoard.sheetBook.alignments[101] = [shape1,shape2]
 * MagicBoard.sheetBook.alignments[103] = [] <-- once there was something here but no more
 *  @static
 **/
Utility.Shape.align = function(pos)
{
    // go through all alignments and check which one is nearest, then return the best possible coordinates
    var xArray = MagicBoard.sheetBook.alignments.x;
    var yArray = MagicBoard.sheetBook.alignments.y;
    var minXdistance = 9999; var minYdistance = 9999;
    var nearestX = pos.x; nearestY = pos.y;
    for (var y in xArray) // This is not traditional array, it has holes // x contains y coordinates
    {
        if  (xArray[y] && xArray[y].length > 0) {

            var diff = Math.abs(pos.y - y) ;

            if (diff < minYdistance)
            { minYdistance = diff;nearestY = y;}
        }
    }
    for (var x in yArray) // This is not traditional array, it has holes
    {
        if ( yArray[x] && yArray[x].length > 0)  {

            var diff = Math.abs(pos.x - x) ;

            if (diff < minXdistance)
            { minXdistance = diff;nearestX = x; }
        }
    }


    if (Math.abs(pos.x - nearestX) < 20) {if (typeof(nearestX) === "string") nearestX = parseInt(nearestX);pos.x = nearestX;}
    if (Math.abs(pos.y - nearestY) < 20) {if (typeof(nearestY) === "string") nearestY = parseInt(nearestY);pos.y = nearestY;}

    return pos;
}

Utility.Shape.connectTo = function(_beginShape,_endShape,_connProp)
{
    var ev = _beginShape.events;
    
    if (_beginShape.parentShape) _beginShape = _beginShape.parentShape;
    if (_endShape.parentShape) _endShape = _endShape.parentShape;
    var endShapes = _beginShape.connectedTo;
    var found = false;
    var eLen = endShapes.length;
    for (var e = 0; e < eLen ; e++)
    {
        var endShape = endShapes[e];
        if (_endShape === endShape) {found = true;break;}
    }
    
    if (!found) {
        _beginShape.connectedTo.push(_endShape);
        _endShape.connectFrom(_beginShape);
    }
    
    
    var cInfo;
    if (found)
    {
        var cLine = MagicBoard.sheetBook.star.cLine;
        cInfo = cLine.cInfo;
        cInfo.connProp = _connProp;
    } else cInfo= Utility.Shape.calculateConnectionPoints(_beginShape,_endShape,_connProp);
    if (!cInfo) return; // can't connect, this can happen if there were issues calculatingConnection points
    if (ev && ev.connectTo && ev.connectTo.click) {if (!cInfo.events) cInfo.events = {};
        cInfo.events.click = ev.connectTo.click;}
    var currentSheet = MagicBoard.sheetBook.currentSheet;
    currentSheet.addConnections(cInfo);
    currentSheet.drawConnections();
}

/**
 *  This Utility function for internal use only (mostly for testing)
 *  @static
 */
Utility.Sheet.drawCourseGrid = function(_sheet)
{

    var sctx = MagicBoard.sheetBook.scratchCtx;
    var scanvas = MagicBoard.sheetBook.scratchCanvas;
    sctx.clearRect(0,0,scanvas.width,scanvas.height);
    sctx.setLineDash([1, 15]);
    sctx.beginPath();

    var gNo = 0;
    // temporary code ends
    for (var y = 0; y < _sheet.noOfYcourseGrids;y++)
    {
        var y1 = y * _sheet.courseGridSize.y;

        sctx.moveTo(0,y1); sctx.lineTo(MagicBoard.sheetBook.cwidth,y1);
        for (var x = 0 ; x < _sheet.noOfXcourseGrids; x++)
        {
            var x1 = x * _sheet.courseGridSize.x;

            sctx.moveTo(x1,0); sctx.lineTo(x1,MagicBoard.sheetBook.cheight);
            var txt = "Filled "+gNo;
            var grid = _sheet.courseGrids[gNo++];
            if (grid.filled) sctx.fillText(txt,x1+20,y1+20);
        }
    }
    sctx.stroke();
}

/**
 *  This Utility function to block grids to show them occupied for future shape to know
 *  @param {Shape} _shape - Provide shape for which occupied positions to be marked
 *  @static
 */
Utility.Shape.blockGrids = function(_shape)
{
    // temporary code
    //Utility.Sheet.drawCourseGrid(_shape.currentSheet);

    var _sheet = _shape.currentSheet;
    var _dim = _shape.dimension;
    var allGrids = _sheet.courseGrids;

    Utility.Shape.unblockGrids(_shape,allGrids);
    var startX = _dim.left; var startY = _dim.top;
    var xCoord = Math.floor(startX/_sheet.courseGridSize.x);
    var yCoord = Math.floor(startY/_sheet.courseGridSize.y);

    var startGridSeq = yCoord*_sheet.noOfXcourseGrids + xCoord;

    var c1 = {x:startX,y:startY};
    var c2 = {x:(startX + _dim.width),y:startY};
    var c3 = {x:startX,y:(startY+_dim.height)};
    var c4 = {x:(startX + _dim.width),y:(startY+_dim.height)};

    var allGrids = _sheet.courseGrids;var gLen = allGrids.length;
    for (var iX = startGridSeq; iX < gLen; iX++ )
    {
        var grid = allGrids[iX];
        var x1,x2,y1,y2;
        x1 = grid.x1; x2 = grid.x2; y1 = grid.y1; y2 = grid.y2;

        // possibilities    1. x2 < c1.x  -- outside
        //                  2. x1 > c2.x  -- outside
        //                  3  y2 < c1.y  -- outside
        //                  4  y1 > c3.y  -- outside
        // remaining all are in scope grids

        if (x2 < c1.x) continue;
        if (x1 > c2.x) continue;
        if (y1 > c3.y) break;
        if (y2 < c1.y) continue; // this will never happen, I think, because we are only going forward
        grid.filled = true;
        grid.shapes.push(_shape);
        _shape.occupiedGrids.push(iX);
    }
}

/**
 *  This Utility function to unblock grids that was previously marked by a shape as occupied
 *  @param {Shape} _shape - Provide shape for which occupied positions to be unmarked
 *  @parm {Array} allGrids - Contains array of all the grids
 *  @static
 */
Utility.Shape.unblockGrids = function(_shape,allGrids)
{

    var occupiedGrids = _shape.occupiedGrids;
    var oLen = occupiedGrids.length;
    for (var i = 0; i < oLen;i++)
    {
        var gridIndex = occupiedGrids[i];
        var grid = allGrids[gridIndex];
        var shapes = grid.shapes;
        var sLen = shapes.length;
        for (var s = 0; s < sLen;s++)
        {
            var sh = shapes[s];
            if (sh === _shape)
            {
                shapes.splice(s,1);
                break;
            }
        }
        if (shapes.length === 0) grid.filled = false;
    }
    _shape.occupiedGrids = [];
    // temporary code
    //Utility.Sheet.drawCourseGrid(_shape.currentSheet);

}

/**
 *  This Utility function is used to calculate the best connection points between two shapes
 *  @param {Shape} _beginShape
 *  @param {Shape} )_endShape
 *  @return {Object} connectionInfo - is used to create ConnectorLine
 *  @static
 */
Utility.Shape.reCalculateConnectionPoints = function(_cInfo)
{
    var beginShape = _cInfo.beginShape; var endShape = _cInfo.endShape;
    // calculate pos and calculate turning points
    var pos = _cInfo.pos;
    
    var startLabel = pos.pointStart.label;
    var endLabel = pos.pointEnd.label;
    
    var frame1 = beginShape.frame.edgePoints;var frame2 = endShape.frame.edgePoints;
    pos.x1 = frame1[startLabel].x;pos.y1 = frame1[startLabel].y;
    pos.x2 = frame2[endLabel].x;pos.y2 = frame2[endLabel].y;
    
    var turningPoints = _cInfo.turningPoints; var p1 = {x:pos.x1,y:pos.y1,angle:pos.startAngle};
    for (var t =0, tLen = turningPoints.length;t < tLen;t++)
    {
        var p2 = turningPoints[t];
        var angle = p1.angle;
        if (angle === 0) p2.y = p1.y;
        else p2.x = p1.x;
        
        p1 = p2;
    }
    var p2 = {x:pos.x2,y:pos.y2};
    for (var t = turningPoints.length - 1;t > -1;t--)
    {
        var p1 = turningPoints[t];
        var angle = p1.angle;
        if (angle === 0) p1.y = p2.y;
        else p1.x = p2.x;
        p2 = p1;
    }
}

/**
 *  This Utility function is used to calculate the best connection points between two shapes
 *  @param {Shape} _beginShape
 *  @param {Shape} _endShape
 *  @return {Object} connectionInfo - is used to create ConnectorLine
 *  @static
 */
Utility.Shape.calculateConnectionPoints = function(_beginShape,_endShape,_connProp)
{
    /*
     if (this.connected && this.connected.connectorShape)
     {
     this.connected.connectorShape.deleteShape();
     }
     */
    
    
    var beginDim = _beginShape.getDimension();
    var endDim = _endShape.getDimension();
    
    var connectingPoints = null;  var bEdge = beginDim.edgePoints; var eEdge = endDim.edgePoints;
    var x1,x2,y1,y2;var turningPoints = [];
    // first see if path is defined
    
    if (MagicBoard.scratch.path.length > 3)
    {
        var lines = Utility.identifyLines(MagicBoard.scratch.path);
        var turningPoints = [];
        for (var l =0, lLen = lines.length; l < lLen ; l++)
        {
            var point = lines[l].point;
            point.angle = lines[l].angle;
            turningPoints.push(point);
        }
        
        /*
         
         */
        turningPoints.push(MagicBoard.scratch.path[MagicBoard.scratch.path.length - 1]);
        // find out which line is intersecting for begin object
        
        tLen = turningPoints.length;
        var pos = {};var p1,p2;
        //
        p1 = turningPoints[tLen - 1]; p2 = turningPoints[tLen - 2];
        if (Utility.isIntersecting(eEdge.c1,eEdge.c2,p1,p2) )
        {
            pos.x2 = eEdge.m12.x;pos.y2 = eEdge.m12.y;pos.pointEnd = {"label":"m12","x":pos.x2,"y":pos.y2};
        } else if (Utility.isIntersecting(eEdge.c2,eEdge.c3,p1,p2) )
        {
            pos.x2 = eEdge.m23.x;pos.y2 = eEdge.m23.y;pos.pointEnd = {"label":"m23","x":pos.x2,"y":pos.y2};
        } else if (Utility.isIntersecting(eEdge.c3,eEdge.c4,p1,p2) )
        {
            pos.x2 = eEdge.m34.x;pos.y2 = eEdge.m34.y;pos.pointEnd = {"label":"m34","x":pos.x2,"y":pos.y2};
        } else if (Utility.isIntersecting(eEdge.c4,eEdge.c1,p1,p2) )
        {
            pos.x2 = eEdge.m41.x;pos.y2 = eEdge.m41.y;pos.pointEnd = {"label":"m41","x":pos.x2,"y":pos.y2};
        } else{
			console.log("No endShape to connect to");
			return null;
		}
        //
        p1 = turningPoints[0];  p2 = turningPoints[1];pos.angle = p1.angle;
        if (Utility.isIntersecting(bEdge.c1,bEdge.c2,p1,p2) )
        {
            pos.pointStart = {};
            pos.y1 = bEdge.m12.y;
            if (_beginShape.param.connectInPlace)  {pos.x1 = p1.x;}
            else pos.x1 = bEdge.m12.x;

            pos.pointStart.label = "m12";pos.pointStart.x  = pos.x1;pos.pointStart.y = pos.y1;
            
        } else if (Utility.isIntersecting(bEdge.c2,bEdge.c3,p1,p2) )
        {
            pos.pointStart = {};
            pos.x1 = bEdge.m23.x;
            if (_beginShape.param.connectInPlace) { pos.y1 = p1.y;}
            else pos.y1 = bEdge.m23.y;
            
            pos.pointStart.label = "m23";pos.pointStart.x  = pos.x1;pos.pointStart.y = pos.y1;

        } else if (Utility.isIntersecting(bEdge.c3,bEdge.c4,p1,p2) )
        {
            pos.pointStart = {};
            pos.y1 = bEdge.m34.y;
            if (_beginShape.param.connectInPlace)  {pos.x1 = p1.x;}
            else pos.x1 = bEdge.m34.x;
            
            pos.pointStart.label = "m34";pos.pointStart.x  = pos.x1;pos.pointStart.y = pos.y1;
        } else if (Utility.isIntersecting(bEdge.c4,bEdge.c1,p1,p2) )
        {
            pos.pointStart = {};
            pos.x1 = bEdge.m41.x;
            if (_beginShape.param.connectInPlace)  {pos.y1 = p1.y;}
            else pos.y1 = bEdge.m41.y;
            
            pos.pointStart.label = "m41";pos.pointStart.x  = pos.x1;pos.pointStart.y = pos.y1;
        } else{
			console.log("No beginShape to connect from");
			return  null;
		}
        

        // align turning points to starting and ending points coordinates
        tLen = turningPoints.length;
        if (tLen > 2)
        {
            //
            
            var p1 = {x:pos.x1,y:pos.y1,angle:turningPoints[0].angle};
            // now remove first and last points
            turningPoints.splice((tLen - 1),1);turningPoints.splice(0,1);
            for (var t =0, tLen = turningPoints.length;t < tLen;t++)
            {
                var p2 = turningPoints[t];
                var angle = p1.angle;
                if (angle === 0) p2.y = p1.y;
                else p2.x = p1.x;
                
                p1 = p2;
            }
            var p2 = {x:pos.x2,y:pos.y2};
            for (var t = turningPoints.length - 1;t > -1;t--)
            {
                var p1 = turningPoints[t];
                var angle = p1.angle;
                if (angle === 0) p1.y = p2.y;
                else p1.x = p2.x;
                p2 = p1;
            }
            
        } else {
            if (tLen === 2 && _beginShape.param.connectInPlace)
            {
                var angle = pos.angle;
                if (angle === 90) pos.x2 = pos.x1;
				else pos.y2 = pos.y1;
            }
            turningPoints = [];
        }
        
        //console.log(turningPoints);// finally
        
        // fix the points based on angles
        
        return {beginShape:_beginShape,endShape:_endShape,pos:pos,turningPoints:turningPoints,"connProp":_connProp};
        
    }
    
    // always  prefer vertical face of the originator
    // if the terminator's vertical face is available then use it
    // else use the closest horizontal face
    
    // find the closest connection point and join them
    // the shapes could in be any 8 positions based on center point
    //
    //          1   |  2  |  3  |  4   |      5
    //      -----------------------------------
    //          6   |  7  |  X  |  8   |      9
    //      -----------------------------------
    //          10  |  11 |  12 |  13  |     14
    
    var orientation = "horiz";
    // find zone
    
    if (bEdge.c1.x > eEdge.c2.x) // the endShape is on the left  (1 6,7, 10)
    {
        var diffX_41_23 = bEdge.m41.x - eEdge.m23.x;
        
        if (diffX_41_23 > 50)
        {
            x1 = bEdge.m41.x;y1 = bEdge.m41.y;
            x2 = eEdge.m23.x;y2 = eEdge.m23.y;
        } else
        {
            var diffY_41_23 = bEdge.m41.y - eEdge.m23.y;
            
            var diffX_12_23 = bEdge.m12.x - eEdge.m23.x;
            var diffY_12_23 = bEdge.m12.y - eEdge.m23.y;
            
            var diffX_34_23 = bEdge.m12.x - eEdge.m23.x;
            var diffY_34_23 = bEdge.m12.y - eEdge.m23.y;
            
            if (diffY_12_23 > 50)
            {
                if ((bEdge.m12.x - eEdge.m34.x) > 50)
                {
                    x1 = bEdge.m12.x;y1 = bEdge.m12.y;
                    x2 = eEdge.m34.x;y2 = eEdge.m34.y;
                    orientation = "vert";
                } else
                {
                    x1 = bEdge.m12.x;y1 = bEdge.m12.y;
                    x2 = eEdge.m23.x;y2 = eEdge.m23.y;
                    orientation = "horizvert";
                }
                
            } else if (diffY_34_23 > 50)
            {
                
                x1 = bEdge.m34.x;y1 = bEdge.m34.y;
                x2 = eEdge.m23.x;y2 = eEdge.m23.y;
                
                orientation = "horizvert";
            } else
            {
                if (diffY_41_23 > 50)
                {
                    var diffY_41_34 = bEdge.m41.y - eEdge.m34.y;
                    if (diffY_41_34 > 50)
                    {
                        x1 = bEdge.m41.x;y1 = bEdge.m41.y;
                        x2 = eEdge.m34.x;y2 = eEdge.m34.y;
                    } else
                    {
                        x1 = bEdge.m41.x;y1 = bEdge.m41.y;
                        x2 = eEdge.m23.x;y2 = eEdge.m23.y;
                    }
                } else
                {
                    x1 = bEdge.m41.x;y1 = bEdge.m41.y;
                    x2 = eEdge.m23.x;y2 = eEdge.m23.y;
                }
                
            }
        }
        
    } else if (bEdge.c2.x < eEdge.c1.x)  // end shape is on the right  (5,8, 9 14)
    {
        var diffX_23_41 = bEdge.m41.x - eEdge.m23.x;
        
        if (diffX_23_41 > 50)
        {
            x1 = bEdge.m23.x;y1 = bEdge.m23.y;
            x2 = eEdge.m41.x;y2 = eEdge.m41.y;
        } else
        {
            var diffY_23_41 = bEdge.m23.y - eEdge.m41.y;
            
            var diffX_23_12 = bEdge.m23.x - eEdge.m12.x;
            var diffY_23_12 = bEdge.m23.y - eEdge.m12.y;
            
            var diffX_23_34 = bEdge.m23.x - eEdge.m34.x;
            var diffY_23_34 = bEdge.m23.y - eEdge.m34.y;
            
            if (Math.abs(diffY_23_34) > 50)
            {
                x1 = bEdge.m23.x;y1 = bEdge.m23.y;
                if (diffY_23_34 > 0)
                {
                    x2 = eEdge.m34.x;y2 = eEdge.m34.y;
                } else
                {
                    x2 = eEdge.m12.x;y2 = eEdge.m12.y;
                }
                
                orientation = "horizvert";
            } else if (diffY_23_12 > 50)
            {
                if ( (eEdge.m41.x - bEdge.m23.x) > 50)
                {
                    x1 = bEdge.m23.x;y1 = bEdge.m23.y;
                    x2 = eEdge.m41.x;y2 = eEdge.m41.y;
                } else
                {
                    x1 = bEdge.m23.x;y1 = bEdge.m23.y;
                    x2 = eEdge.m12.x;y2 = eEdge.m12.y;
                    orientation = "horizvert";
                }
                
            } else
            {
                x1 = bEdge.m23.x;y1 = bEdge.m23.y;
                x2 = eEdge.m41.x;y2 = eEdge.m41.y;
            }
        }
        //x1 = bEdge.m23.x;y1 = bEdge.m23.y;
        //x2 = eEdge.m41.x;y2 = eEdge.m41.y;
        
    } else if (bEdge.c1.y > eEdge.c3.y) // the endShape is on the top   (2,3,4)
    {
        x1 = bEdge.m12.x;y1 = bEdge.m12.y;
        x2 = eEdge.m34.x;y2 = eEdge.m34.y;
        
        orientation = "vert";
    } else   // end shape is in the bottom (11,12,13)
    {
        x1 = bEdge.m34.x;y1 = bEdge.m34.y;
        x2 = eEdge.m12.x;y2 = eEdge.m12.y;
        orientation = "vert";
    }
    
    return {beginShape:_beginShape,endShape:_endShape,pos:{x1:x1,x2:x2,y1:y1,y2:y2},"orientation":orientation,"connProp":_connProp};
}

/**
 *  This Utility function is used to calculate the best connection points between two shapes
 *  @param {Shape} _beginShape
 *  @param {Shape} )endShape
 *  @return {Object} connectionInfo - is used to create ConnectorLine
 *  @static
 */
Utility.Shape.defineConnectionCoordinates = function(_connectorLine,_cInfo)
{
    var angleStart,angleEnd;
    var arrowLen = 0;
    var cx1,cx2,cy1,cy2,x1,y1;
    var pos = _cInfo.pos;
    var x1 = pos.x1; var y1 = pos.y1; var left = x1;var top = y1;
    var x2 = pos.x2;var y2 = pos.y2  ; // to compensate for arrow head
    if (x2 < x1) left = x2; if (y2< y1) top = y2;
    left = left - 10; top = top - 10;
    var width = Math.abs(pos.x2 - pos.x1) + 20;
    var height = Math.abs(pos.y2 - pos.y1) + 20;
    
    _connectorLine.frame = {"width":width,"height":height,"unit":"px","left":left,"top":top};
    var midX = (pos.x1+pos.x2)/2;
    var midY = (pos.y1+pos.y2)/2;
    var lines = []; var d = [];
    lines.push({"op":"M","x":pos.x1,"y":pos.y1});
    d.push({"op":"M","x":(pos.x1 - left)*100/width,"y":(pos.y1 - top)*100/height});


    var connProp = _cInfo.connProp;
    if (_cInfo.turningPoints && _cInfo.turningPoints.length > 0)
    {
        var minX = pos.x1; var minY = pos.y1; var maxX = pos.x1;  var maxY = pos.y1;
 
        var turningPoints = _cInfo.turningPoints;
        var tLen = turningPoints.length;
        
        // calculate min max to recalculate height and width
        for (var t = 0; t < tLen;t++)
        {
            var p2 = turningPoints[t];
            
            if (p2.x < minX) minX = p2.x; if (p2.y < minY) minY = p2.y;
            if (p2.x > maxX) maxX = p2.x; if (p2.y > maxY) maxY = p2.y;
        }
        
        if (pos.x2 < minX) minX = pos.x2; if (pos.y2 < minY) minY = pos.y2;
        if (pos.x2 > maxX) maxX = pos.x2; if (pos.y2 > maxY) maxY = pos.y2;
        
        if ((_connectorLine.frame.width < (maxX - minX + 20))) {_connectorLine.frame.width = (maxX - minX + 20);width = _connectorLine.frame.width;}
        if (_connectorLine.frame.height < (maxY - minY + 20)) {_connectorLine.frame.height = (maxY - minY + 20);height = _connectorLine.frame.height;}
        
        if (left > minX) { left = minX - 10;_connectorLine.frame.left = left;}
        if (top > minY)  { top = minY- 10;_connectorLine.frame.top = top;}
 
        // recalculate starting point based on new width and height;
        d[0] = {"op":"M","x":(pos.x1 - left)*100/width,"y":(pos.y1 - top)*100/height};
        for (var t = 0; t < tLen;t++)
        {
            var p2 = turningPoints[t];
            
            lines.push({"op":"L","x":p2.x,"y":p2.y});
            d.push({"op":"L","x":(p2.x- left)*100/width,"y":(p2.y - top)*100/height});
        }
        
        angleStart = Drawing.getLineAngle(pos.x1,pos.y1,turningPoints[0].x,turningPoints[0].y);
        angleEnd = Drawing.getLineAngle(pos.x2,pos.y2,turningPoints[tLen -1].x,turningPoints[tLen - 1].y);
        
    } else
    {
        //lines.push({"op":"L","x":pos.x2,"y":pos.y2});
        //d.push({"op":"L","x":(pos.x2- left)*100/width,"y":(pos.y2 - top)*100/height});
        
        angleStart = Drawing.getLineAngle(pos.x1,pos.y1,pos.x2,pos.y2);
        angleEnd = Drawing.getLineAngle(pos.x2,pos.y2,pos.x1,pos.y1);
    }
    
    /*
    {
        if (connProp.type === "DIRECT")
        {
            angleStart = Drawing.getLineAngle(x1,y1,x2,y2);
            angleEnd = Drawing.getLineAngle(x2,y2,x1,y1);
        } else if (connProp.type === "TWOBEND")
        {
            if (_cInfo.orientation === "vert")
            {
                lines.push({"op":"L","x":pos.x1,"y":midY});
                lines.push({"op":"L","x":x2,"y":midY});
                
                angleStart = Drawing.getLineAngle(x1,y1,x1,midY);
                angleEnd = Drawing.getLineAngle(x2,y2,x2,midY);
                
                d.push({"op":"L","x":(pos.x1- left)*100/width,"y":(midY - top)*100/height});
                d.push({"op":"L","x":(x2- left)*100/width,"y":(midY - top)*100/height});
                
                
                //dString += " L"+pos.x1+" "+midY;
                //dString += " L"+x2+" "+midY;
                
                if (y2 > pos.y1) { y2 = y2 - arrowLen; cy1 = y1 + arrowLen; cy2 = y2 - arrowLen;}
                else { y2 = y2 + arrowLen; cy1 = y1 - arrowLen; cy2 = y2 + arrowLen;}
                
                cx1 = x1 ; cx2 = x2 ;
                
            } else if (_cInfo.orientation === "horizvert")
            {
                lines.push({"op":"L","x":pos.x2,"y":pos.y1});
                
                angleStart = Drawing.getLineAngle(x1,y1,pos.x2,pos.y1);
                angleEnd = Drawing.getLineAngle(x2,y2,pos.x2,pos.y1);
                
                d.push({"op":"L","x":(pos.x2- left)*100/width,"y":(pos.y1 - top)*100/height});
                //dString += " L"+pos.x2+" "+pos.y1;
                
                if (y2 > pos.y1) { y2 = y2 - arrowLen; cy1 = y1;cy2 = y2 - arrowLen;}
                else {y2 = y2 + arrowLen; cy1 = y1; cy2 = y2 + arrowLen;}
                
                if (x2 > pos.x1) {cx1 = x1 + arrowLen; cx2 = x2 ; }
                else {cx1 = x1 - arrowLen; cx2 = x2 ;}
            } else
            {
                lines.push({"op":"L","x":midX,"y":pos.y1});
                lines.push({"op":"L","x":midX,"y":y2});
                
                angleStart = Drawing.getLineAngle(x1,y1,midX,pos.y1);
                angleEnd = Drawing.getLineAngle(x2,y2,midX,y2);
                
                d.push({"op":"L","x":(midX - left)*100/width,"y":(pos.y1 - top)*100/height});
                d.push({"op":"L","x":(midX - left)*100/width,"y":(y2 - top)*100/height});
                //dString += " L"+midX+" "+pos.y1;
                //dString += " L"+midX+" "+y2;
                
                if (x2 > pos.x1) {x2 = x2 - arrowLen;cx1 = x1 + arrowLen; cx2 = x2 - arrowLen; }
                else {x2 = x2 + arrowLen;cx1 = x1 - arrowLen; cx2 = x2 + arrowLen;}
                
                cy1 = y1; cy2 = y2;
                
            }
            
        }
    }
    */

    _connectorLine.cInfo.angleStart = angleStart; _connectorLine.cInfo.angleEnd = angleEnd;
    _connectorLine.cx1 = cx1; _connectorLine.cx2 = cx2;_connectorLine.cy1 = cy1;_connectorLine.cy2 = cy2;

    lines.push({"op":"L","x":x2,"y":y2});
    d.push({"op":"L","x":(x2 - left)*100/width,"y":(y2 - top)*100/height});
    return {"d":d,"lines":lines};
}


/**
 *  This Utility function is used to remove connection between two shapes
 *  @static
 *  @param {Shape} _sheet - Sheet for which the connection to be removed
 *  @param {Shape} _beginShape
 *  @param {Shape} _endShape
 */
Utility.Sheet.removeConnection = function(_sheet,_beginShape,_endShape)
{
    var conn = _sheet.connections;
    var cLen = conn.length;

    for (var i = 0; i < cLen;i++)
    {
        var cI = conn[i];
        if (cI.beginShape === _beginShape && cI.endShape === _endShape)
        {
            conn.splice(i,1);
            cI.shape.deleteShape(); // also delete the connection
            return ;
        }
    }
}
Utility.identifyLines = function(_path)
{
    // calculateAngles,
    //var pos1 = MagicBoard.scratch.path[p-1];var dx1 = pos.x - pos1.x; var dy1 = pos.y - pos1.y;
    //console.log(Math.atan((pos.y-pos1.y)/(pos.x-pos1.x))*180/Math.PI+","+Math.sqrt( dx1 * dx1 + dy1 * dy1 ) + ","+pos.x+","+pos.y);
    var pLen = _path.length;
    if (pLen < 3) return []; // mininum three points needed
    var lines = [];var nextLine = {"point":null,"length":0,"angle":null};
    
    
    var pos0 = _path[0];var currentLine = {id:0,"point":pos0,"length":0,"angle":null,active:false};
    for (var p = 1; p < pLen ; p++)
    {
        var pos1 = _path[p];
        
        var angle = Math.abs(Math.atan( (pos1.y - pos0.y)/(pos1.x - pos0.x)  )*180/Math.PI);
        if (angle == NaN) continue;
        pos1.angle = angle; // for debugging purpose
        
        angle = Math.round(angle/45) * 45; // round it to 45 degrees
        pos1.curedAngle = angle; // for debugging purpose
        
        if (currentLine.active)
        {
            var diff = Math.abs(Math.abs(angle) - Math.abs(currentLine.angle));
            if (diff > 45) // observatory period
            {
                if (!nextLine.count) {
                    nextLine.point = pos1;nextLine.angle = angle; nextLine.active = true;
                    nextLine.count = 0;
                }
                nextLine.count++;
                var dx = (pos1.x - nextLine.point.x); var dy = (pos1.y - nextLine.point.y);
                nextLine.length =  Math.sqrt(dx * dx + dy*dy);
                if (nextLine.count > 6)
                {
                    lines.push(currentLine);
                    nextLine.id = currentLine.id+1;
                    currentLine =  nextLine; currentLine.angle = angle;
                    nextLine = {"point":null,"length":0,"angle":null,active:false};
                }
            } else
            {
                if (nextLine.active) nextLine = {"point":null,"length":0,"angle":null,active:false,count:0}; // throw it out
                
                var dx = (pos1.x - currentLine.point.x); var dy = (pos1.y - currentLine.point.y);
                currentLine.length =  Math.sqrt(dx * dx + dy*dy);
            }
        } else {currentLine.angle = angle;currentLine.active = true;}
        pos0 = pos1;
    }
    if (lines.length === 0 || (currentLine.id !== lines[lines.length - 1])) {
		if (lines.length === 0) lines.push(currentLine);
		else
		{
			var prevLine = lines[lines.length - 1];
			var dx = (currentLine.point.x - prevLine.point.x); var dy = (currentLine.point.y - prevLine.point.y);
			var dist =  Math.sqrt(dx * dx + dy*dy);
			if (dist > 10) lines.push(currentLine);
		}

	}
    
    /*
    for (var p = _path.length -1;p > -1; p--) console.log("("+_path[p].x +","+_path[p].y+") - "+_path[p].curedAngle+" - "+_path[p].angle);
    
    console.log(lines);
    */
    
    return lines;
}

/**
 *  This Utility function is for internal use to format dimension data that come in px or % format
 *  @static
 */
Utility.Shape.dataFormatter = function(_dimensionData,_type,_shape)
{
    if (_dimensionData == undefined) return 0;
    if (typeof(_dimensionData) === "number") return _dimensionData;
    else if (typeof(_dimensionData) === "string")
    {
        if (_dimensionData.indexOf("px") > -1) return parseInt(_dimensionData.replace("px",""));
        if (_dimensionData.indexOf("%") > -1)
        {
            if (!_shape) {
                console.log(" In order to calculate %, we need the shape, that is missing in the call");
                return 0;
            }

            var val = parseInt(_dimensionData.replace("%",""));
            // need to know parent's dimension to calculate pixel
            var parentDimension = null;
            if (_shape.parentShape) parentDimension = _shape.parentShape.dimension;
            else {
                var sheetBook = MagicBoard.sheetBook;
                parentDimension = {left:0,top:0,width:sheetBook.cwidth,height:sheetBook.cheight};
            }
            var parentType = _type;
            if (_type === "left") parentType = "width";
            else if (_type === "top") parentType = "height";

            return parentDimension[parentType] * val/100

        }
    }

}

/**
 *  This Utility function is for internal use
 *  @static
 */
Utility.Shape.recalculateDimensions = function(_shape)
{
    var dimension = _shape.dimension;
    if (!dimension.misc.unit) return;
    if (dimension.misc.unit === "%")
    {
        var types = dimension.misc.key
        var tLen = types.length;
        for (var i = 0; i < tLen ; i++)
        {
            var type = types[i];
            var dimensionData = _shape.style[type];
            var val = Utility.Shape.dataFormatter(dimensionData,type,_shape);
            dimension[type] = val;
        }
    }
}

Utility.isIntersecting = function(p1, p2, p3, p4)
{
    var CCW = function(_p1, _p2, _p3) {
        return (_p3.y - _p1.y) * (_p2.x - _p1.x) > (_p2.y - _p1.y) * (_p3.x - _p1.x);
    };
    return (CCW(p1, p3, p4) != CCW(p2, p3, p4)) && (CCW(p1, p2, p3) != CCW(p1, p2, p4));
}

/**
 *  This Utility function is for internal use to destroy a HTML Dom
 *  @static
 */
Utility.destroyDom = function(_item,_type)
{
    var garbage = MagicBoard.sheetBook.garbage;
    var dom = null;
    if (_type === "id")
    {
        dom = document.getElementById(_item);

    } else if (_type === "dom") dom = _item;

    garbage.appendChild(dom);
    garbage.innerHTML = "";
}

/**
 * This is for internal logging use
 * @constructor
 */
var Logger = function()
{
    var console = function(msg)
    {
        console.log(msg);
    }
}

/**
 * This is for internal logging use
 * @constructor
 */
var Info = function()
{

}

inheritsFrom(Info,Logger);
Info.prototype.console = function(msg)
{
    console.log("Info - "+msg);
}

/**
 * This is for internal logging use
 * @constructor
 */
var Warning = function()
{

}

inheritsFrom(Warning,Logger);
Warning.prototype.console = function(msg)
{
    console.log("Warning - "+msg);
}

/**
 * This is for internal logging use
 * @constructor
 */
var Error = function()
{

}

inheritsFrom(Error,Logger);
Error.prototype.console = function(msg)
{
    Error.log("Error - "+msg);
}

var info = new Info();var warning = new Warning(); var error = new Error();