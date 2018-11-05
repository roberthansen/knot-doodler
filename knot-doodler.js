class GridWall {
    constructor() {
        this.isEdge = false;
        this.state = 'unblocking';
        this.setPersistentState = function() {};
        this.center = [ 0, 0 ];
        this.gridPitch = 100;
        this.direction = 'horizontal';
        this.adjacentGridDots = {
            forward : null,
            backward : null
        };
        this.adjacentGridCells = {
            left : null,
            right : null
        }
        this.setPeristentState = null;

        this.shapeVisible = document.createElementNS( 'http://www.w3.org/2000/svg', 'line' );
        this.shapeVisible.setAttribute( 'class', 'wall-visible' );

        this.shapeInteractivity = document.createElementNS( 'http://www.w3.org/2000/svg', 'polygon' );
        this.shapeInteractivity.setAttribute( 'class', 'wall-interactivity' );
        
        this.shapeGroup = document.createElementNS( 'http://www.w3.org/2000/svg', 'g' );

        this.synchronize();

        this.shapeGroup.appendChild( this.shapeVisible );
        this.shapeGroup.appendChild( this.shapeInteractivity );

        let gridWall = this;
        this.shapeGroup.addEventListener( 'click', function() { gridWall.clickEventHandler(); } );
    }

    setup( center, gridPitch, direction, initialState, isEdge, persistentStateSetter ) {
        this.setGridPitch( gridPitch );
        this.setIsEdge( isEdge );
        this.setPersistentState = persistentStateSetter;
        this.setState( initialState );
        this.setCenter( center );
        this.setDirection( direction );
    }

    setCenter( center ) {
        this.center = center;
        this.synchronize();
    }

    setGridPitch( pitch ) {
        this.gridPitch = pitch;
        this.synchronize();
    }

    setIsEdge( isEdge ) {
        this.isEdge = isEdge; 
        if( isEdge ) {
            this.setState( 'blocking' );
        }
    }

    setDirection( newDirection ){
        let oldDirection = this.direction;
        switch( newDirection ){
            case 'horizontal':
            case 'vertical':
                this.direction = newDirection;
                break;
            default:
                this.direction = oldDirection;
                break;
        }
        this.synchronize();
    }

    setState( newState ) {
        if( !this.isEdge ) {
            console.log( '        setting grid wall state to ' + newState );
            this.state = newState;
            switch ( newState ) {
                case 'blocking':
                    this.setPersistentState( true );
                    break;
                case 'unblocking':
                default:
                    this.setPersistentState( false );
                    break
            }
        } else {
            this.state = 'blocking';
        }
        this.synchronize();
    }
    toggleState() {
        console.log( 'toggling grid wall state' );
        console.log( '    old state: '+ this.state );
        switch( this.state ){
            case 'unblocking':
                this.setState( 'blocking' );
                break;
            case 'blocking':
            default:
                this.setState( 'unblocking' );
                break;
        }
        console.log( '    new state: ' + this.state );
    }
    verifyState() {
        let gridDots = this.getAdjacentGridDots();
        let gridCells = this.getAdjacentGridCells();
        if( gridDots.some( val => val.state == 'blocking' ) || gridCells.some( val => val.state == 'blocking' ) ) {
            this.setState( 'blocking' );
        }
    }

    setAdjacentGridDots( dictionaryOfGridDots ) {
        let gridWall = this;
        Object.keys( dictionaryOfGridDots ).forEach( function( key ) {
            if( Object.keys( gridWall.adjacentGridDots ).includes( key ) ) {
                gridWall.adjacentGridDots[key] = dictionaryOfGridDots[key];
            }
        } );
    }

    setAdjacentGridCells( dictionaryOfGridCells ) {
        let gridWall = this;
        Object.keys( dictionaryOfGridCells ).forEach( function( key ) {
            if( Object.keys( gridWall.adjacentGridCells ).includes( key ) ) {
                gridWall.adjacentGridCells[key] = dictionaryOfGridCells[key];
            }
        } );
    }

    getAdjacentGridDots() {
        let gridDots = [
            this.adjacentGridDots.forward,
            this.adjacentGridDots.backward
        ];
        return gridDots;
    }
    getAdjacentGridCells() {
        let gridCells = [
            this.adjacentGridCells.left,
            this.adjacentGridCells.right
        ].filter( gridCell => gridCell !== null );
        return gridCells;
    }

    synchronize() {
        let polygonPoints = [
            [ -0.35 * this.gridPitch, 0.15 * this.gridPitch ],
            [ -0.2 * this.gridPitch, 0.3 * this.gridPitch ],
            [ 0.2 * this.gridPitch, 0.3 * this.gridPitch ],
            [ 0.35 * this.gridPitch, 0.15 * this.gridPitch ],
            [ 0.35 * this.gridPitch, -0.15 * this.gridPitch ],
            [ 0.2 * this.gridPitch, -0.3 * this.gridPitch ],
            [ -0.2 * this.gridPitch, -0.3 * this.gridPitch ],
            [ -0.35 * this.gridPitch, -0.15 * this.gridPitch ],
        ];
        let polygonPointsString = polygonPoints.map( s => s.join( ',' ) ).join( ' ' ); 

        let length = 0.8 * this.gridPitch;
        let linePoints = [ -0.5 * length, 0, 0.5 * length, 0 ];
        this.shapeVisible.setAttribute( 'x1', linePoints[0] );
        this.shapeVisible.setAttribute( 'y1', linePoints[1] );
        this.shapeVisible.setAttribute( 'x2', linePoints[2] );
        this.shapeVisible.setAttribute( 'y2', linePoints[3] );

        this.shapeInteractivity.setAttribute( 'points', polygonPointsString );

        let transformString = '';
        switch( this.direction ){
            case 'vertical':
                transformString = `translate(${this.center[0]} ${this.center[1]}) rotate(90)`;
                break;
            case 'horizontal':
            default:
                transformString = `translate(${this.center[0]} ${this.center[1]})`;
                break;
        } 
        if( !this.isEdge ) {
            this.shapeGroup.setAttribute( 'class', 'wall-group ' + this.state )
        } else {
            this.shapeGroup.setAttribute( 'class', 'wall-group blocking edge');
        }
        this.shapeGroup.setAttribute( 'transform', transformString );
    }

    clickEventHandler() {
        if( !this.isEdge ) {
            let gridCells = this.getAdjacentGridCells();
            let gridDots = this.getAdjacentGridDots();
            this.toggleState();

            // tell adjacent cells and dots to check whether their state is correct:
            for( let idx in gridDots ) {
                gridDots[idx].verifyState();
            }
            for( let idx in gridCells ) {
               gridCells[idx].verifyState(); 
            }
        }
    }
}

class GridDot {
    constructor() {
        this.center = [ 0, 0 ];
        this.state = 'unblocking';
        this.gridPitch = 100;
        this.adjacentGridWalls = {
            north : null,
            west : null,
            south : null,
            east : null,
        };
        this.adjacentGridCells = {
            northwest : null,
            southwest : null,
            southeast : null,
            northeast : null
        }
        this.setPersistentState = null;

        this.shapeVisible = document.createElementNS( 'http://www.w3.org/2000/svg', 'line' );
        this.shapeVisible.setAttribute( 'x1', 0 );
        this.shapeVisible.setAttribute( 'y1', 0 );
        this.shapeVisible.setAttribute( 'x2', 0 );
        this.shapeVisible.setAttribute( 'y2', 0 );
        this.shapeVisible.setAttribute( 'class', 'grid-dot' );

        this.shapeInteractivity = document.createElementNS( 'http://www.w3.org/2000/svg', 'polygon' );
        this.shapeInteractivity.setAttribute( 'class', 'grid-dot-interactivity' );

        this.shapeGroup = document.createElementNS( 'http://www.w3.org/2000/svg', 'g' );
        this.shapeGroup.setAttribute( 'class', 'grid-dot-group ' + this.state );

        this.synchronize();

        this.shapeGroup.appendChild( this.shapeInteractivity );
        this.shapeGroup.appendChild( this.shapeVisible );

        let gridDot = this;
        this.shapeGroup.addEventListener( 'click', function() { gridDot.clickEventHandler(); } );
    }

    setup( center, pitch, initialState, persistentStateSetter ) {
        this.setCenter( center );
        this.setGridPitch( pitch );
        this.setPersistentState = persistentStateSetter;
        this.setState( initialState );
    }

    setGridPitch( pitch ) {
        this.gridPitch = pitch;
        this.synchronize();
    }
    setCenter( centerPoint ) {
        this.center = centerPoint;
        this.synchronize();
    }

    setState( newState ) {
        console.log( '        setting grid dot state to ' + newState );
        this.state = newState;
        switch( this.state ) {
            case 'blocking':
                this.setPersistentState( true );
                break;
            case 'unblocking':
                this.setPersistentState( false );
                break;
        }
        this.synchronize();
    }
    toggleState() {
        console.log( 'toggling grid dot state' );
        console.log( '    old state: ' + this.state );
        switch( this.state ) {
            case 'unblocking':
                this.setState( 'blocking' );
                break;
            case 'blocking':
            default:
                this.setState( 'unblocking' );
                break;
        }
        console.log( '    new state: ' + this.state );
    }
    verifyState() {
        let gridWalls = this.getAdjacentGridWalls();
        if( gridWalls.some( val => val.state == 'unblocking' ) ) {
            this.setState( 'unblocking' );
        } else if( gridWalls.every( val => val.state == 'blocking' ) ) {
            this.setState( 'blocking' );
        }
    }

    setAdjacentGridWalls( dictionaryOfGridWalls ) {
        let gridDot = this;
        Object.keys( dictionaryOfGridWalls ).forEach( function( key ) {
            if( Object.keys( gridDot.adjacentGridWalls ).includes( key ) ) {
                gridDot.adjacentGridWalls[key] = dictionaryOfGridWalls[key];
            }
        } );
    }

    setAdjacentGridCells( dictionaryOfGridCells ) {
        let gridDot = this;
        Object.keys( dictionaryOfGridCells ).forEach( function( key ) {
            if( Object.keys(gridDot.adjacentGridCells ).includes( key ) ) {
                gridDot.adjacentGridCells[key] = dictionaryOfGridCells[key];
            }
        } );
    }

    getAdjacentGridWalls() {
        let gridWalls = [
            this.adjacentGridWalls.north,
            this.adjacentGridWalls.west,
            this.adjacentGridWalls.south,
            this.adjacentGridWalls.east
        ].filter( gridWall => gridWall !== null );
        return gridWalls;
    }

    getAdjacentGridCells() {
        let gridCells = [
            this.adjacentGridCells.northwest,
            this.adjacentGridCells.southwest,
            this.adjacentGridCells.southeast,
            this.adjacentGridCells.northeast
        ].filter( gridCell => gridCell !== null );
        return gridCells;
    }

    synchronize() {
        let polygonPoints = [
            [ -0.15 * this.gridPitch, 0.15 * this.gridPitch ],
            [ 0.15 * this.gridPitch, 0.15 * this.gridPitch ],
            [ 0.15 * this.gridPitch, -0.15 * this.gridPitch ],
            [ -0.15 * this.gridPitch, -0.15 * this.gridPitch ]
        ]
        let polygonPointsString = polygonPoints.map( s => s.join( ',' ) ).join( ' ');
        this.shapeInteractivity.setAttribute( 'points', polygonPointsString );

        this.shapeGroup.setAttribute( 'class', 'grid-dot-group ' + this.state );
        this.shapeGroup.setAttribute( 'transform', `translate(${this.center[0]} ${this.center[1]})`);
    }

    clickEventHandler() {
        console.log( 'click event trigged for grid dot' );
        let gridWalls = this.getAdjacentGridWalls();
        let gridCells = this.getAdjacentGridCells();
        this.verifyState();
        this.toggleState();
        for( let idx in gridWalls ) {
            gridWalls[idx].setState( this.state );
        }
        for( let idx in gridCells ) {
            gridCells[idx].verifyState();
        }
    }
}

class GridCell {
    constructor() {
        this.center = [ 0, 0 ];
        this.gridPitch = 100;
        this.state = 'unblocking';
        this.adjacentGridWalls = {
            north : null,
            west : null,
            south : null,
            east : null,
        }
        this.adjacentGridDots = {
            northwest : null,
            southwest : null,
            southeast : null,
            northeast : null
        }
        this.setPersistentState = function() {};


        this.shapeVisible = document.createElementNS( 'http://www.w3.org/2000/svg', 'line' );
        this.shapeVisible.setAttribute( 'x1', 0 );
        this.shapeVisible.setAttribute( 'y1', 0 );
        this.shapeVisible.setAttribute( 'x2', 0 );
        this.shapeVisible.setAttribute( 'y2', 0 );
        this.shapeVisible.setAttribute( 'class', 'grid-cell-dot' );

        this.shapeInteractivity = document.createElementNS( 'http://www.w3.org/2000/svg', 'polygon' );
        this.shapeInteractivity.setAttribute( 'class', 'grid-cell-interactivity' );

        this.shapeBackground = document.createElementNS( 'http://www.w3.org/2000/svg', 'rect' );
        this.shapeBackground.setAttribute( 'class', 'grid-cell-background' );

        this.shapeGroup = document.createElementNS( 'http://www.w3.org/2000/svg', 'g' );

        this.synchronize();

        this.shapeGroup.appendChild( this.shapeBackground );
        this.shapeGroup.appendChild( this.shapeInteractivity );
        this.shapeGroup.appendChild( this.shapeVisible );

        let gridCell = this;
        this.shapeGroup.addEventListener( 'click', function() { gridCell.clickEventHandler(); } );
    }

    setup( center, gridPitch, initialState, persistentStateSetter ) {
        this.setCenter( center )
        this.setGridPitch( gridPitch );
        this.setPersistentState = persistentStateSetter;
        this.setState( initialState );
    }

    setCenter( center ) {
        this.center = center;
        this.synchronize();
    }

    setGridPitch( pitch ) {
        this.gridPitch = pitch;
        this.synchronize();
    }

    setState( newState ) {
        console.log( '        setting grid cell state to ' + newState );
        this.state = newState;
        switch( this.state ) {
            case 'blocking':
                this.setPersistentState( true );
                break;
            case 'unblocking':
            default:
                this.setPersistentState( false );
                break;
        }
        this.synchronize();
    }
    toggleState() {
        console.log( 'toggling grid cell state' );
        console.log( '    old state: ' + this.state );
        switch( this.state ) {
            case 'blocking':
                this.setState( 'unblocking' );
                this.setPersistentState( false );
                break;
            case 'unblocking':
            default:
                this.setState( 'blocking' );
                this.setPersistentState( true );
                break;
        }
        console.log( '    new state: ' + this.state );
    }
    verifyState() {
        let gridWalls = this.getAdjacentGridWalls();
        if( gridWalls.some( val => val.state == 'unblocking' ) ) {
            this.setState( 'unblocking' );
        }
    }


    setAdjacentGridWalls( dictionaryOfGridWalls ) {
        let gridCell = this;
        Object.keys( dictionaryOfGridWalls ).forEach( function( key ) {
            if( Object.keys( gridCell.adjacentGridWalls ).includes( key ) ) {
                gridCell.adjacentGridWalls[key] = dictionaryOfGridWalls[key];
            }
        } );
    }

    setAdjacentGridDots( dictionaryOfGridDots) {
        let gridCell = this;
        Object.keys( dictionaryOfGridDots ).forEach( function( key ) {
            if( Object.keys( gridCell.adjacentGridDots ).includes( key ) ) {
                gridCell.adjacentGridCells[key] = dictionaryOfGridDots[key];
            }
        } );
        
    }

    getAdjacentGridWalls() {
        let gridWalls = [
            this.adjacentGridWalls.north,
            this.adjacentGridWalls.west,
            this.adjacentGridWalls.south,
            this.adjacentGridWalls.east
        ].filter( gridWall => gridWall !== null );
        return gridWalls;
    }

    getAdjacentGridDots() {
        let gridDots = [
            this.adjacentGridDots.northwest,
            this.adjacentGridDots.southwest,
            this.adjacentGridDots.southeast,
            this.adjacentGridDots.northeast
        ].filter( gridDot => gridDot !== null );
        return gridDots;
    }

    synchronize() {
        let polygonPoints = [
            [ -0.2 * this.gridPitch, 0.2 * this.gridPitch ],
            [ 0.2 * this.gridPitch, 0.2 * this.gridPitch ],
            [ 0.2 * this.gridPitch, -0.2 * this.gridPitch ],
            [ -0.2 * this.gridPitch, -0.2 * this.gridPitch ]
        ]
        let polygonPointsString = polygonPoints.map( s => s.join( ',' ) ).join( ' ');
        this.shapeInteractivity.setAttribute( 'points', polygonPointsString );

        this.shapeBackground.setAttribute( 'x', -0.4 * this.gridPitch );
        this.shapeBackground.setAttribute( 'y', -0.4 * this.gridPitch );
        this.shapeBackground.setAttribute( 'rx', 0.05 * this.gridPitch );
        this.shapeBackground.setAttribute( 'ry', 0.05 * this.gridPitch );
        this.shapeBackground.setAttribute( 'width', 0.8 * this.gridPitch );
        this.shapeBackground.setAttribute( 'height', 0.8 * this.gridPitch );

        this.shapeGroup.setAttribute( 'class', 'grid-cell-group ' + this.state );
        this.shapeGroup.setAttribute( 'transform', `translate(${this.center[0]} ${this.center[1]})` );
    }

    clickEventHandler() {
        console.log( 'click event triggered for grid cell' );
        let gridWalls = this.getAdjacentGridWalls();

        this.toggleState();
        for( let idx in gridWalls ) {
            gridWalls[idx].verifyState();
        };
    }
}
class Rope {
    constructor() {
        this.gridCell = null;
        this.width = 50;
        this.offset = 5;
        this.visibility = true;
        this.shapes = [];
        this.shapeGroup = document.createElementNS( 'http://www.w3.org/2000/svg', 'g' );
        this.shapeGroup.setAttribute( 'class', 'grid-rope-group' );
    }

    // setters:
    setWidth( newWidth) {
        this.width = newWidth;
    }
    setOffset( newOffset ) {
        this.offset = newOffset;
    }
    setGridCell( gridCell ) {
        this.gridCell = gridCell;
        this.synchronize();
    }
    setVisibility( visibility ) {
        this.visibility = visibility;
    }

    // getters:
    getCenter() {
        return this.gridCell.center;
    }
    getGridPitch() {
        return this.gridCell.gridPitch;
    }
    getGridWalls() {
        return this.gridCell.adjacentGridWalls;
    }
    synchronize() {
        let polygonStrings = [];
        let transformStrings = [];
        let gridWalls = this.gridCell.getAdjacentGridWalls();
        let gridWallStates = gridWalls.map( gridWall => gridWall.state == 'blocking' );
        let numberBlockingGridWalls = gridWallStates.reduce( ( total, gridWallState ) => total + gridWallState, 0 );
        let rotationAngle = [ 90, 0, 270, 180 ];

        let hw = this.width / 2;
        let os = this.offset;
        let cx = this.gridCell.gridPitch / 2;
        let cy = this.gridCell.gridPitch / 2;
        let groupTransformString = '';
        switch( numberBlockingGridWalls ) {
            case 0:
                polygonStrings = Array(4).fill( `0,${cy-hw} 0,${cy+hw} ${cx-hw-os},${2*cy-os} ${cx-os},${2*cy-hw-os}` );
                transformStrings = ['',`rotate(90 ${cx} ${cy})`, `rotate(180 ${cx} ${cy})`, `rotate(270 ${cx} ${cy})`];
                groupTransformString = `translate(${this.gridCell.center[0]-cx},${this.gridCell.center[1]-cy})`;
                break;
            case 1:
                polygonStrings = [
                    `${os},${cy-hw-os} ${os},${cy+hw+os} ${cx-hw-os},${2*cy-os} ${cx-os},${2*cy-hw-os} ${Math.sqrt(2)*hw+os},${cy+(Math.sqrt(2)-1)*hw+os} ${Math.sqrt(2)*hw+os},${cy+(1-Math.sqrt(2))*hw-os} ${cx+hw},0 ${cx-hw},0`,
                    `0,${cy-hw} 0,${cy+hw} ${cx-hw-os},${2*cy-os} ${cx-os},${2*cy-hw-os}`,
                    `0,${cy-hw} 0,${cy+hw} ${cx-hw-os},${2*cy-os} ${cx-os},${2*cy-hw-os}`
                ];
                transformStrings = [
                    '',
                    `rotate( 180 ${cx/2} ${cy/2}),translate(${-cx} ${-cy})`,
                    `rotate( 270 ${cx/2} ${cy/2}),translate(${-cx} ${0})`
                ];
                groupTransformString = `translate(${this.gridCell.center[0]-cx},${this.gridCell.center[1]-cy}),rotate(${rotationAngle[gridWallStates.findIndex(x=>x)]} ${cx} ${cy})`;
                break;
            case 2:
                let rotationIndex = 0;
                if( ( gridWallStates[0] && gridWallStates[2] ) || ( gridWallStates[1] && gridWallStates[3] ) ) { // check whether two blocking walls are contiguous or opposing
                    polygonStrings = Array(2) .fill(
                        `0,${cy-hw} 0,${cy+hw} ${cx-hw-os},${2*cy-os} ${cx+hw+os},${2*cy-os} ${2*cx-os},${cy+hw+os} ${2*cx-hw-os},${cy+os} ${cx+(Math.sqrt(2)-1)*hw+os},${2*cy-Math.sqrt(2)*hw-os} ${cx-(Math.sqrt(2)-1)*hw-os},${2*cy-Math.sqrt(2)*hw-os}`,
                    );
                    transformStrings = [
                        '',
                        `rotate(180 ${cx} ${cy})`
                    ];
                    rotationIndex = gridWallStates.findIndex(x=>!x);
                } else {
                    polygonStrings = [
                        `0,${cy-hw} 0,${cy+hw} ${cx-hw-os},${2*cy-os} ${cx-os},${2*cy-hw-os}`,
                        `${os},${os} ${os},${cy+hw+os} ${cx-hw-os},${2*cy-os} ${cx-os},${2*cy-hw-os} ${Math.sqrt(2)*hw+os},${cy+(Math.sqrt(2)-1)*hw+os} ${Math.sqrt(2)*hw+os},${Math.sqrt(2)*hw+os} ${cx+(Math.sqrt(2)-1)*hw+os},${Math.sqrt(2)*hw+os} ${2*cx},${cy+hw} ${2*cx},${cy-hw} ${cx+hw+os},${os}`
                    ];
                    transformStrings = [
                        '',
                        `rotate(90 ${cx} ${cy})`
                    ];
                    if( !gridWallStates[0] && !gridWallStates[3] ) {
                        rotationIndex = 3
                    } else {
                        rotationIndex = gridWallStates.findIndex(x=>!x);
                    }
                }
                groupTransformString = `translate(${this.gridCell.center[0]-cx},${this.gridCell.center[1]-cy}),rotate(${rotationAngle[rotationIndex]} ${cx} ${cy})`;
                break;
            case 3:
                polygonStrings = [ `${0},${cy-hw} ${0},${cy+hw} ${cx-hw-os},${2*cy-os} ${cx+hw+os},${2*cy-os} ${2*cx-os},${cy+hw+os} ${2*cx-os},${cy-hw-os} ${cx+hw+os},${os} ${cx-hw-os},${os} ${os},${cx-hw-os} ${hw+os},${cy-os} ${cx-(Math.sqrt(2)-1)*hw-os},${Math.sqrt(2)*hw+os} ${cx+(Math.sqrt(2)-1)*hw+os},${Math.sqrt(2)*hw+os} ${2*cx-Math.sqrt(2)*hw-os},${cy-(Math.sqrt(2)-1)*hw-os} ${2*cx-Math.sqrt(2)*hw-os},${cy+(Math.sqrt(2)-1)*hw+os} ${cx+(Math.sqrt(2)-1)*hw+os},${2*cy-Math.sqrt(2)*hw-os} ${cx-(Math.sqrt(2)-1)*hw-os},${2*cy-Math.sqrt(2)*hw-os}` ];
                transformStrings = [ '' ];
                groupTransformString = `translate(${this.gridCell.center[0]-cx},${this.gridCell.center[1]-cy}),rotate(${rotationAngle[gridWallStates.findIndex(x=>!x)]} ${cx} ${cy})`;
                break;
            case 4:
                if( this.gridCell.state == 'blocking' ) {
                    polygonStrings = [];
                    transformStrings = [];
                    groupTransformString = '';
                } else {
                    polygonStrings = [ `${os},${cy-hw-os} ${os},${cy+hw+os} ${cx-hw-os},${2*cy-os} ${cx+hw+os},${2*cy-os} ${2*cx-os},${cy+hw+os} ${2*cx-os},${cy} ${2*cx-Math.sqrt(2)*hw-os},${cy} ${2*cx-Math.sqrt(2)*hw-os},${cy+(Math.sqrt(2)-1)*hw+os} ${cx+(Math.sqrt(2)-1)*hw+os},${2*cy-Math.sqrt(2)*hw-os} ${cx-(Math.sqrt(2)-1)*hw-os},${2*cy-Math.sqrt(2)*hw-os} ${Math.sqrt(2)*hw+os},${cy+(Math.sqrt(2)-1)*hw+os} ${Math.sqrt(2)*hw+os},${cy-(Math.sqrt(2)-1)*hw-os} ${cx-(Math.sqrt(2)-1)*hw-os},${Math.sqrt(2)*hw+os} ${cx+(Math.sqrt(2)-1)*hw+os},${Math.sqrt(2)*hw+os} ${2*cx-Math.sqrt(2)*hw-os},${cy-(Math.sqrt(2)-1)*hw-os} ${2*cx-Math.sqrt(2)*hw-os},${cy} ${2*cx-os},${cy} ${2*cx-os},${cy-hw-os} ${cx+hw+os},${os} ${cx-hw-os},${os}` ];
                    transformStrings = [ '' ];
                    groupTransformString = `translate(${this.gridCell.center[0]-cx},${this.gridCell.center[1]-cy})`;
                }
                break;
        }
        this.shapeGroup.innerHTML = '';
        
        for( let idx in polygonStrings ) {
            let newShape = document.createElementNS( 'http://www.w3.org/2000/svg', 'polygon' );
            newShape.setAttribute( 'class', 'grid-rope-segment' );
            newShape.setAttribute( 'points', polygonStrings[idx] );
            newShape.setAttribute( 'transform', transformStrings[idx] );
            this.shapes.push( newShape );
            this.shapeGroup.appendChild( newShape );
        }
        this.shapeGroup.setAttribute( 'transform', groupTransformString );
    }
}

class Grid {
    constructor() {
        this.pitch = 100;
        this.number = [ 2, 2 ]; // two points on each side--results in a single cell.
        this.points = [];
        this.state = {
            cells : [],
            dots : [],
            horizontalWalls : [],
            verticalWalls : []
        };

        this.verticalWalls = [];
        this.verticalWallShapeArray = document.createElementNS( 'http://www.w3.org/2000/svg', 'g' );
        this.verticalWallShapeArray.setAttribute( 'id', 'vertical-grid-walls-array' );
        this.verticalWallShapeArray.setAttribute( 'class', 'visible' );
        this.horizontalWalls = [];
        this.horizontalWallShapeArray = document.createElementNS( 'http://www.w3.org/2000/svg', 'g' );
        this.horizontalWallShapeArray.setAttribute( 'id', 'horizontal-grid-walls-array' );
        this.horizontalWallShapeArray.setAttribute( 'class', 'visible' );
        this.dots = [];
        this.dotShapeArray = document.createElementNS( 'http://www.w3.org/2000/svg', 'g' );
        this.dotShapeArray.setAttribute( 'id', 'grid-dot-array' );
        this.dotShapeArray.setAttribute( 'class', 'visible' );
        this.cells = [];
        this.cellShapeArray = document.createElementNS( 'http://www.w3.org/2000/svg', 'g' );
        this.cellShapeArray.setAttribute( 'id', 'grid-cell-array' );
        this.cellShapeArray.setAttribute( 'class', 'visible' );
        this.ropes = [];
        this.ropeShapeArray = document.createElementNS( 'http://www.w3.org/2000/svg', 'g' );
        this.ropeShapeArray.setAttribute( 'id', 'rope-array' );
        this.ropeShapeArray.setAttribute( 'class', 'hidden' );
    }

    // setters:
    setPitch( pitch ) {
        this.pitch = pitch;
    }

    setNumber( number ) {
        this.number = number;
    }

    setElementState( elementType, elementIndices, value ) {
        if( elementIndices[0] >= 0 && elementIndices[1] >= 0 ){
            switch( elementType ) {
                case 'cell':
                    if( elementIndices[1] < this.state.cells.length && elementIndices[0] < this.state.cells[ elementIndices[1] ].length ) {
                        this.state.cells[ elementIndices[1] ][ elementIndices[0] ] = value; 
                    }
                    break;
                case 'dot':
                    if( elementIndices[1] < this.state.dots.length && elementIndices[0] < this.state.dots[ elementIndices[1] ].length ) {
                        this.state.dots[ elementIndices[1] ][ elementIndices[0] ] = value; 
                    }
                    break;
                case 'horizontalWall':
                    if( elementIndices[1] < this.state.horizontalWalls.length && elementIndices[0] < this.state.horizontalWalls[ elementIndices[1] ].length ) {
                        this.state.horizontalWalls[ elementIndices[1] ][ elementIndices[0] ] = value; 
                    }
                    break;
                case 'verticalWall':
                    if( elementIndices[1] < this.state.verticalWall.length && elementIndices[0] < this.state.verticalWall[ elementIndices[1] ].length ) {
                        this.state.verticalWall[ elementIndices[1] ][ elementIndices[0] ] = value; 
                    }
                    break;
            }
            this.synchronize();
        }
    }
    setPersistentState() { // sends a sparse version of the state variable to the server
        let parseCookies = function() {
            let cookies = {};
            if( document.cookie && document.cookie !=='' ) {
                document.cookie.split( ';' ).forEach( function( c ) {
                    let m = c.trim().match(/((\w+)=(.*)/);
                    if( m !== undefined ) {
                        cookies[ m[1] ] = decodeURIComponent( m[2] );
                    }
                } );
            }
        }
        let stateMinimal = { gridId:'beta0', cells:[], dots:[], hWalls:[], vWalls:[] };
        this.state.cells.map( (row,idxY) => row.filter(x=>x).map( (cell,idxX) => stateMinimal.cells.push([idxX,idxY]) ) );
        this.state.dots.map( (row,idxY) => row.filter(x=>x).map( (dot,idxX) => stateMinimal.dots.push([idxX,idxY]) ) );
        this.state.horizontalWalls.map( (row,idxY) => row.filter(x=>x).map( (hWall,idxX) => stateMinimal.hWalls.push([idxX,idxY]) ) );
        this.state.verticalWalls.map( (row,idxY) => row.filter(x=>x).map( (vWall,idxX) => stateMinimal.vWalls.push([idxX,idxY]) ) );
        console.log( 'sending xml request' );
        let xmlRequest = new XMLHttpRequest();
            xmlRequest.open( 'POST', '/toys/knot-doodler-state-updater' );
            xmlRequest.setRequestHeader( 'Content-Type', 'application/json' );
            xmlRequest.send( JSON.stringify( stateMinimal ) );
    }
    getPersistentState() {}

    synchronize() {
        let grid = this;
        // reset the points:
        this.points = [];
        for( let j=0; j<this.number[1]; j++ ) {
            let pointsRow = [];
            for( let i=0; i<this.number[0]; i++ ) {
                pointsRow.push( [ this.pitch * i, this.pitch * j ] );
            }
            this.points.push( pointsRow );
        }

        // reset dots, cells, and ropes:
        this.dots = [];
        this.cells = [];
        this.ropes = [];
        this.dotShapeArray.innerHTML = '';
        this.cellShapeArray.innerHTML = '';
        this.ropeShapeArray.innerHTML = '';
        for( let j=0; j<this.number[1]; j++ ) {
            let dotRow = [];
            let cellRow = [];
            let ropeRow = [];
            let initialState = '';
            for( let i=0; i<this.number[0]; i++ ) {
                if( i>0 && j>0 ) {
                    let newCell = new GridCell;
                    initialState = 'unblocking'
                    if( this.state.cells[j-1][i-1] ) {
                        initialState = 'blocking';
                    }
                    newCell.setup( [ ( i-0.5 ) * this.pitch, ( j-0.5 ) * this.pitch ], this.pitch, initialState, function( newState ) { grid.state.cells[j-1][i-1] = newState; } );
                    cellRow.push( newCell );
                    this.cellShapeArray.appendChild( newCell.shapeGroup );

                    let newRope = new Rope;
                    newRope.setWidth( 45 );
                    newRope.setOffset( 5 );
                    ropeRow.push( newRope );
                    this.ropeShapeArray.appendChild( newRope.shapeGroup );
                }
                let newDot = new GridDot;
                initialState = 'unblocking';
                if( this.state.dots[j][i] ) {
                    initialState = 'blocking';
                }
                newDot.setup( [ i * this.pitch, j * this.pitch ], this.pitch, initialState, function( newState ) { grid.state.dots[j][i] = newState; } );
                dotRow.push( newDot );
                this.dotShapeArray.appendChild( newDot.shapeGroup );
            }
            this.dots.push( dotRow );
            if( j>0 ) {
                this.cells.push( cellRow );
                this.ropes.push( ropeRow );
            }
        }

        // reset walls:
        this.horizontalWalls = [];
        this.horizontalWallShapeArray.innerHTML = '';
        this.verticalWalls = [];
        this.verticalWallShapeArray.innerHTML = '';
        for( let j=0; j<this.number[1]; j++ ) {
            let horizontalWallRow = [];
            let verticalWallRow = [];
            for( let i=0; i<this.number[0]; i++ ) {
                let isHorizontalEdge = j==0 || j==this.number[1]-1;
                let isVerticalEdge = i==0 || i==this.number[0]-1;
                if( i>0 ) { // skip first point for horizontal walls
                    let newHorizontalWall = new GridWall;
                    let initialState = '';
                    if(this.state.horizontalWalls[j][i-1] ) {
                        initialState = 'blocking';
                    } else {
                        initialState = 'unblocking';
                    }
                    newHorizontalWall.setup( [ ( i-0.5) * this.pitch, j * this.pitch ], this.pitch, 'horizontal', initialState, isHorizontalEdge, function( newState ) { grid.state.horizontalWalls[j][i-1] = newState; } );
                    horizontalWallRow.push( newHorizontalWall );
                }
                if( j>0 ) { // skip first point for vertical walls
                    let newVerticalWall = new GridWall;
                    let initialState = '';
                    if( this.state.verticalWalls[j-1][i] ) {
                        initialState = 'blocking';
                    } else {
                        initialState = 'unblocking';
                    }
                    newVerticalWall.setup([ i * this.pitch, ( j-0.5 ) * this.pitch], this.pitch, 'vertical', initialState, isVerticalEdge, function( newState ) { grid.state.verticalWalls[j-1][i] = newState; } )
                    verticalWallRow.push( newVerticalWall );
                }
            }
            horizontalWallRow.map( wall => this.horizontalWallShapeArray.appendChild( wall.shapeGroup ) );
            verticalWallRow.map( wall => this.verticalWallShapeArray.appendChild( wall.shapeGroup ) );
            this.horizontalWalls.push( horizontalWallRow );
            if( j>0 ) {
                this.verticalWalls.push( verticalWallRow );
            }
        }
    }

    updateAdjacentElements() {
        // update cells and ropes:
        for( let j=0; j<this.number[1]-1; j++ ) {
            for( let i=0; i<this.number[0]-1; i++ ) {
                let adjacentWalls = {
                    north : this.horizontalWalls[j][i],
                    west : this.verticalWalls[j][i],
                    east : this.verticalWalls[j][i+1],
                    south : this.horizontalWalls[j+1][i]
                };
                let adjacentCells = {
                    northwest : this.dots[j][i],
                    southwest : this.dots[j+1][i],
                    southeast : this.dots[j+1][i+1],
                    northeast : this.dots[j][i+1]
                }
                this.cells[j][i].setAdjacentGridWalls( adjacentWalls );
                this.ropes[j][i].setGridCell( this.cells[j][i] );
                this.ropes[j][i].synchronize();
            }
        }
        // update horizontal walls:
        for( let j=0; j<this.number[1]; j++ ) {
            for( let i=0; i<this.number[0]-1; i++ ) {
                let adjacentCells = {
                    left : null,
                    right : null
                }
                if( j>0 ){
                    adjacentCells.left = this.cells[j-1][i];
                }
                if( j<this.number[1]-1 ) {
                    adjacentCells.right = this.cells[j][i];
                }
                let adjacentDots = {
                    backward : this.dots[j][i],
                    forward : this.dots[j][i+1]
                };
                this.horizontalWalls[j][i].setAdjacentGridCells( adjacentCells );
                this.horizontalWalls[j][i].setAdjacentGridDots( adjacentDots );
            }
        }

        // update vertical walls:
        for( let j=0; j<this.number[1]-1; j++ ) {
            for( let i=0; i<this.number[0]; i++ ) {
                let adjacentCells = {
                    left : null,
                    right : null
                }
                if( i>0 ){
                    adjacentCells.right = this.cells[j][i-1];
                }
                if( i<this.number[0]-1 ) {
                    adjacentCells.left = this.cells[j][i];
                };
                let adjacentDots = {
                    backward : this.dots[j][i],
                    forward : this.dots[j+1][i]
                };
                this.verticalWalls[j][i].setAdjacentGridCells( adjacentCells );
                this.verticalWalls[j][i].setAdjacentGridDots( adjacentDots );
            }
        }

        // update dots:
        for( let j=0; j<this.number[1]; j++ ) {
            for( let i=0; i<this.number[0]; i++ ) {
                let adjacentWalls = {
                    north : null,
                    south : null,
                    west : null,
                    east : null
                }
                let adjacentCells = {
                    northwest : null,
                    southwest : null,
                    southeast : null,
                    northeast : null
                }
                if( j>0 ) {
                    adjacentWalls.north = this.verticalWalls[j-1][i];
                    if( i>0 ) {
                        adjacentCells.northwest = this.cells[j-1][i-1];
                    }
                    if( i<this.number[0]-1 ) {
                        adjacentCells.northeast = this.cells[j-1][i]
                    }
                }
                if( j<this.number[1]-1 ) {
                    adjacentWalls.south = this.verticalWalls[j][i];
                    if( i>0 ) {
                        adjacentCells.southwest = this.cells[j][i-1];
                    }
                    if( i<this.number[0]-1) {
                        adjacentCells.southeast = this.cells[j][i]
                    }
                }
                if ( i>0 ) {
                    adjacentWalls.west = this.horizontalWalls[j][i-1];
                }
                if( i<this.number[0]-1 ) {
                    adjacentWalls.east = this.horizontalWalls[j][i];
                }
                this.dots[j][i].setAdjacentGridWalls( adjacentWalls );
                this.dots[j][i].setAdjacentGridCells( adjacentCells );
            }
        }
    }

    // reset the state arrays so that all walls and cells are unblocking:
    resetState() {
        for( let j=0; j<this.number[1]; j++ ) {
            // set a row of horizontal walls to unblocking:
            this.state.horizontalWalls.push( Array( this.number[0] - 1 ).fill( j==0 || j==this.number[1] - 1 ) );
            this.state.dots.push( Array( this.number[0]).fill( false ) );

            // there is one fewer rows of grid dots and horizontal walls than vertical walls:
            if( j>0) {
                // set a row of grid dots to unblocking:
                this.state.cells.push( Array( this.number[0] - 1 ).fill( false ) );

                // set a row of vertical walls to unblocking:
                this.state.verticalWalls.push( Array( this.number[0] ).fill( false ) );
                this.state.verticalWalls[j-1][0] = true;
                this.state.verticalWalls[j-1][ this.number[0] - 1 ] = true;
            }
        }
    }
}

function setup() {
    var svgContainer = document.getElementById( 'canvas-container' );
    var svgRoot = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' );
    var ropeFilter = document.createElementNS( 'http://www.w3.org/2000/svg', 'filter' );
        ropeFilter.setAttribute( 'id', 'rope-shadow' );
        ropeFilter.setAttribute( 'x', 0 );
        ropeFilter.setAttribute( 'y', 0);
        ropeFilter.setAttribute( 'width', '125%' );
        ropeFilter.setAttribute( 'height', '125%' );
    var ropeFilterOffset = document.createElementNS( 'http://www.w3.org/2000/svg', 'feOffset' );
        ropeFilterOffset.setAttribute( 'result', 'offOut' );
        ropeFilterOffset.setAttribute( 'in', 'SourceAlpha' );
        ropeFilterOffset.setAttribute( 'dx', 3 );
        ropeFilterOffset.setAttribute( 'dy', 3 );
    var ropeFilterBlur = document.createElementNS( 'http://www.w3.org/2000/svg', 'feGaussianBlur' );
        ropeFilterBlur.setAttribute( 'result', 'blurOut' );
        ropeFilterBlur.setAttribute( 'in', 'offOut' );
        ropeFilterBlur.setAttribute( 'stdDeviation', 5 );
    var ropeFilterBlend = document.createElementNS( 'http://www.w3.org/2000/svg', 'feBlend' )
        ropeFilterBlend.setAttribute( 'in', 'SourceGraphic' );
        ropeFilterBlend.setAttribute( 'in2', 'blurOut' );
        ropeFilterBlend.setAttribute( 'mode', 'normal' );
    ropeFilter.appendChild( ropeFilterOffset );
    ropeFilter.appendChild( ropeFilterBlur );
    ropeFilter.appendChild( ropeFilterBlend );
    svgRoot.appendChild( ropeFilter );

    var grid = new Grid;
        grid.setPitch( 100 );
        grid.setNumber( [ 8, 10 ] );
        grid.resetState();
        grid.synchronize();
        grid.updateAdjacentElements();

    svgRoot.setAttribute( 'id', 'svg-root' );
    svgRoot.setAttribute( 'viewBox', `-${0.5*grid.pitch} -${0.5*grid.pitch} ${(grid.number[0])*grid.pitch} ${(grid.number[1])*grid.pitch}`);
    svgRoot.setAttribute( 'preserveAspectRatio', 'xMidYMid slice' );

    svgRoot.appendChild( grid.cellShapeArray );
    svgRoot.appendChild( grid.horizontalWallShapeArray );
    svgRoot.appendChild( grid.verticalWallShapeArray );
    svgRoot.appendChild( grid.dotShapeArray );
    svgRoot.appendChild( grid.ropeShapeArray );

    svgContainer.appendChild( svgRoot );
    
    function reveal() {
        let svgRoot = document.getElementById( 'svg-root' );
        let ropeArray = document.getElementById( 'rope-array' );
        let dotArray = document.getElementById( 'grid-dot-array' );
        let cellArray = document.getElementById( 'grid-cell-array' );
        let horizontalWallArray = document.getElementById( 'horizontal-grid-walls-array' );
        let verticalWallArray = document.getElementById( 'vertical-grid-walls-array' );
        let visibilitySwitch = document.getElementById( 'rope-visibility-switch' );
        let ropes = grid.ropes;
        switch( ropeArray.getAttribute( 'class' ) ) {
            case 'visible':
                svgRoot.setAttribute( 'class', 'light' );
                dotArray.setAttribute( 'class', 'visible' );
                cellArray.setAttribute( 'class', 'visible' );
                horizontalWallArray.setAttribute( 'class', 'visible' );
                verticalWallArray.setAttribute( 'class', 'visible' );
                ropeArray.setAttribute( 'class', 'hidden' );
                visibilitySwitch.innerHTML = 'Show Knot';
                break;
            case 'hidden':
                svgRoot.setAttribute( 'class', 'dark' );
                ropes.map( ropeRow => ropeRow.map( rope => rope.synchronize() ) );
                dotArray.setAttribute( 'class', 'hidden' );
                cellArray.setAttribute( 'class', 'hidden' );
                horizontalWallArray.setAttribute( 'class', 'hidden' );
                verticalWallArray.setAttribute( 'class', 'hidden' );
                ropeArray.setAttribute( 'class', 'visible' );
                visibilitySwitch.innerHTML = 'Show Grid';
                break;
        }
    }
    document.getElementById( 'svg-root' ).setAttribute( 'class', 'light' );
    var item = document.getElementsByClassName( 'item' )[0];
    var switchArea = document.createElement( 'div' );
        switchArea.setAttribute( 'id', 'rope-visibility-switch-container' );
    var switchWidget = document.createElement( 'div' );
        switchWidget.innerHTML = 'Show Knot';
        switchWidget.setAttribute( 'id', 'rope-visibility-switch' );
        switchWidget.addEventListener( 'click', function() { reveal(); } );
    switchArea.appendChild( switchWidget );
    item.appendChild( switchArea );
}

window.addEventListener( 'load', setup );
