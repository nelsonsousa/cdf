;
(function() {

  /* Sparkline AddIn, based on jquery.sparkline.js sparklines.
   * 
   */
  var sparkline = {
    name: "sparkline",
    label: "Sparkline",
    defaults: {
      type: 'line'
    },    
    init: function(){

      // Register this for datatables sort
      var myself = this;
      $.fn.dataTableExt.oSort[this.name+'-asc'] = function(a,b){
        return myself.sort(a,b)
      };
      $.fn.dataTableExt.oSort[this.name+'-desc'] = function(a,b){
        return myself.sort(b,a)
      };
        
    },
    
    sort: function(a,b){
      return this.sumStrArray(a) - this.sumStrArray(b);
    },
    
    sumStrArray: function(arr){
      return arr.split(',').reduce(function(prev, curr, index, array){  
        Dashboards.log("Current " + curr +"; prev " +  prev); 
        return parseFloat(curr) + (typeof(prev)==='number'?prev:parseFloat(prev));
      });
    },
    
    implementation: function (tgt, st, opt) {
      var t = $(tgt);
      t.sparkline(st.value.split(/,/),opt);
      t.removeClass("sparkline");
    }
  };
  Dashboards.registerAddIn("Table", "colType", new AddIn(sparkline));

  var pvSparkline = {
    name: "pvSparkline",
    label: "Protovis Sparkline",
    defaults: {
      height: 10,
      strokeStyle: "#000",
      lineWidth: 1,
      width: undefined,
      canvasMargin: 2
    },
    init: function(){

      // Register this for datatables sort
      var myself = this;
      $.fn.dataTableExt.oSort[this.name+'-asc'] = function(a,b){
        return myself.sort(a,b)
      };
      $.fn.dataTableExt.oSort[this.name+'-desc'] = function(a,b){
        return myself.sort(b,a)
      };
        
    },
    
    sort: function(a,b){
      return this.sumStrArray(a) - this.sumStrArray(b);
    },
    
    sumStrArray: function(arr){
      return arr.split(',').reduce(function(prev, curr, index, array){  
        Dashboards.log("Current " + curr +"; prev " +  prev); 
        return parseFloat(curr) + (typeof(prev)==='number'?prev:parseFloat(prev));
      });
    },
    
    implementation: function(tgt, st, opt) {
      var ph = $(tgt),
      sparklineData = st.value,
      data = sparklineData.split(",");
      n = data.length,
      w = opt.width || ph.width(),
      h = opt.height,
      min = pv.min.index(data),
      max = pv.max.index(data);
      ph.empty();
    
      var container = $("<div></div>").appendTo(ph);
    
      //console.log("count "+count);
    
      var vis = new pv.Panel()
      .canvas(container.get(0))
      .width(w)
      .height(h)
      .margin(opt.canvasMargin);
    
      vis.add(pv.Line)
      .data(data)
      .left(pv.Scale.linear(0, n - 1).range(0, w).by(pv.index))
      .bottom(pv.Scale.linear(data).range(0, h))
      .strokeStyle(opt.strokeStyle)
      .lineWidth(opt.lineWidth);        

      vis.render();

      
    }
  };
  Dashboards.registerAddIn("Table", "colType", new AddIn(pvSparkline));


  var dataBar = {
    name: "dataBar",
    label: "Data Bar",
    defaults: {
      widthRatio:1,
      height: 10,
      startColor: "#55A4D6",
      endColor: "#448FC8",
      backgroundImage: undefined,
      stroke: null,
      max: undefined,
      min: undefined,
      includeValue: false,
      absValue: true,
      valueFormat: function(v, format, st) {
        return "" + sprintf(format || "%.1f",v) ;
      }
    },
    init: function(){
      $.fn.dataTableExt.oSort[this.name+'-asc'] = $.fn.dataTableExt.oSort['numeric-asc'];
      $.fn.dataTableExt.oSort[this.name+'-desc'] = $.fn.dataTableExt.oSort['numeric-desc'];
    },
    implementation: function(tgt, st, opt) {
      var tblMax = Math.max.apply(Math,st.tableData.map(function(e){
                               return e[st.colIdx];
                             })),
          tblMin = Math.min.apply(Math,st.tableData.map(function(e){
                               return e[st.colIdx];
                             }));
      if (opt.absValue){
        var max = opt.max || Math.max( Math.abs(tblMax), Math.abs(tblMin) ),
            min = opt.min || 0,
            val = Math.abs(parseFloat(st.value));
        min = Math.max(min,0);
      }else{
        var max = opt.max || Math.max(0, tblMax),
            min = opt.min || Math.min(0, tblMin),
            val = parseFloat(st.value);
      }
      var maxTotal = max - min;


      var cell = $(tgt);
      cell.empty(); 
      var ph =$("<div>&nbsp;</div>").addClass('dataBarContainer').appendTo(cell);
      var wtmp = opt.widthRatio * ph.width();
      var htmp = opt.height;       
    
      var leftVal  = Math.min(val,0),
          rightVal = Math.max(val,0);

      var xx = pv.Scale.linear(min,max).range(0,wtmp); 
      
      var paperSize = xx(Math.min(rightVal,max)) - xx(min);
      paperSize = (paperSize>1)?paperSize:1;
      var paper = Raphael(ph.get(0), paperSize , htmp);
      var c = paper.rect(xx(leftVal), 0, xx(rightVal)-xx(leftVal), htmp);
    
      c.attr({
        fill: opt.backgroundImage?"url('"+opt.backgroundImage+"')":"90-"+opt.startColor + "-" + opt.endColor,
        stroke: opt.stroke,
        title: "Value: "+ st.value
      });

      if(opt.includeValue) {
        var valph = $("<span></span>").addClass('value').append(opt.valueFormat(st.value, st.colFormat, st));
        valph.appendTo(ph);
      }
    }
  };
  Dashboards.registerAddIn("Table", "colType", new AddIn(dataBar));


  var trendArrow = {
    name: "trendArrow",
    label: "Trend Arrows",
    defaults: {
      good: true,
      includeValue: false,
      valueFormat: function(v,format,st) {
        return sprintf(format || "%.1f",v);
      }
    },
    init: function(){
      $.fn.dataTableExt.oSort[this.name+'-asc'] = $.fn.dataTableExt.oSort['numeric-asc'];
      $.fn.dataTableExt.oSort[this.name+'-desc'] = $.fn.dataTableExt.oSort['numeric-desc'];
    },
    implementation: function(tgt, st, opt) {
      var ph = $(tgt),
      qualityClass = opt.good ? "good" : "bad",
      trendClass =  st.value == 0 ? "neutral" : st.value < 0 ? "down" : "up";
      var trend = $("<div>&nbsp;</div>");
      trend.addClass('trend ' + trendClass + ' '  + qualityClass);
      ph.empty();
      if(opt.includeValue) {
        ph.append(opt.valueFormat(st.value, st.colFormat, st));
      }
      ph.append(trend);
    }
  };
  Dashboards.registerAddIn("Table", "colType", new AddIn(trendArrow));


  var link = {
    name: "hyperlink",
    label: "Hyperlink",
    defaults:{
      openInNewTab: true,
      prependHttpIfNeeded: true,
      regexp: null,
      pattern: null,
      urlReference: 2,
      labelReference: 1
    },
    
    init: function(){
      $.fn.dataTableExt.oSort[this.name+'-asc'] = $.fn.dataTableExt.oSort['string-asc'];
      $.fn.dataTableExt.oSort[this.name+'-desc'] = $.fn.dataTableExt.oSort['string-desc'];
    },
    
    implementation: function(tgt, st, opt){
      
      var ph = $(tgt);
      var link, label;
      if (opt.pattern) {
        var re = new RegExp(opt.pattern),
          results = re.exec(st.value);
        link = results[opt.urlReference];
        label = results[opt.labelReference];
      } else {
        link = st.value;
        label = st.value;
      }
      if (opt.prependHttpIfNeeded && !/^https?:\/\//.test(link)){
        link = "http://" + link;
      }
      // is this text an hyperlink? 
      if(opt.regexp == null || (new RegExp(opt.regexp).test(st.value))){
        var a = $("<a></a>").attr("href",link).addClass("hyperlinkAddIn");
        a.text(label);
        if(opt.openInNewTab){
          a.attr("target","_blank");
        }
        ph.empty().append(a);
      }
    }
    
  };
  Dashboards.registerAddIn("Table", "colType", new AddIn(link));

  var circle = {
    name: "circle",
    label: "Circle",
    defaults:{
      canvasSize: 10,
      radius: 4,
      color: 'black',
      title: function(st) {return "Value: " + st.value;}
    },
    
    implementation: function(tgt, st, opt){
      var p = $(tgt).empty(),
        v = st.value,
        op,
        options = {},
        w,
        paper;

      for (key in opt) if (opt.hasOwnProperty(key)) {
        op = opt[key];
        options[key] = typeof op == 'function' ?
          op.call(this,st):
          op;
      }
      w = options.canvasSize;
      paper = Raphael(tgt, options.canvasSize, options.canvasSize);
      var r = paper.circle(w/2,w/2,options.radius);
      r.attr({
          fill: options.color,
          opacity: 1,
          "stroke-width":0,
          "title": options.title
      });
    }
    
  };
  Dashboards.registerAddIn("Table", "colType", new AddIn(circle));

  var bullet = {
    name: "cccBulletChart",
    label: "Bullet Chart",
    defaults:{
      height: 40,
      animate: false,
      orientation: "horizontal",
      bulletSize: 16,     // Bullet height
      bulletSpacing: 150, // Spacing between bullets
      bulletMargin: 5,   // Left margin
      // Specific values
      bulletRanges: [30,80,100],
      extensionPoints: {
        "bulletMarker_shape":"triangle",
        "bulletTitle_textStyle":"green",
        "bulletMeasure_fillStyle":"black",
        "bulletRuleLabel_font":"8px sans-serif",
        "bulletRule_height": 5
      }
    },

    init: function(){
      $.fn.dataTableExt.oSort[this.name+'-asc'] = $.fn.dataTableExt.oSort['string-asc'];
      $.fn.dataTableExt.oSort[this.name+'-desc'] = $.fn.dataTableExt.oSort['string-desc'];
    },

    sort: function()  {
      
    },

    implementation: function(tgt, st, opt){
      var chartOptions = $.extend(true,{},opt);
      var $tgt = $(tgt);
      var target = $("<span></span>").appendTo($tgt.empty());
      var values = st.value.split(",");
      var data = this.getData(values);

      chartOptions.canvas = target.get(0);
      chartOptions.width = chartOptions.width || $tgt.width();
      chartOptions.bulletMeasures = [values[0]];
      chartOptions.bulletMarkers = [values[1]];
 
      var chart = new pvc.BulletChart(chartOptions);
      chart.setData(data,{});
      chart.render();
    },

    getData: function(values) {
      var dataSet = {
          resultset: [values],
          metadata: []
        },
        i;
      for (i = 0; i < values.length;i++) {
        dataSet.metadata.push({
          colIndex: i,
          colType: "String",
          colName: ""
        });
      }
      return dataSet;
    }    
  };
  Dashboards.registerAddIn("Table", "colType", new AddIn(bullet));

 var formattedText = {
    name: "formattedText",
    label: "Formatted Text",
    defaults: {
      textFormat: function(v, st) {return st.colFormat ? sprintf(st.colFormat,v) : v;}
    },

    init: function(){
      $.fn.dataTableExt.oSort[this.name+'-asc'] = $.fn.dataTableExt.oSort['string-asc'];
      $.fn.dataTableExt.oSort[this.name+'-desc'] = $.fn.dataTableExt.oSort['string-desc'];
    },
    
    implementation: function(tgt, st, opt){
      var text = opt.textFormat.call(this, st.value, st, opt);
      $(tgt).empty().append(text);
    }
    
  };
  Dashboards.registerAddIn("Table", "colType", new AddIn(formattedText));

})();


