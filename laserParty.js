import {
    Object3D, PlaneGeometry, BoxGeometry,
    Mesh, MeshBasicMaterial, MeshPhongMaterial,
    FrontSide, DoubleSide, Vector3, MathUtils,
    Texture, AdditiveBlending, Raycaster,
    SpriteMaterial, Sprite, Clock,
} from 'three'


const laserMain = {
    all: [],
    hasInit: false,
    globalRaycastObjects: [],
    globalAnimationSpeed: 1,
    defaults: {

        // meta
        scale: 1,
        addTo: {},

        // base
        baseBox: true,

        // laser
        hue: 0,
        side: 0,
        spin: 0,
        count: 1,
        spread: 1,
        angleX: 0,
        angleY: 0,
        distance: 30,
        thickness: 1,
        lightness: .5,
        saturation: 1,
        enabled: true,
        raycast: true,
        pointAt: null,
        raycastOnce: false,

        // animation
        speed: 1,
        animation: null,
        colorAnimation: null,

    },
    transforms: {
        init( data ) {
            laserMain.transforms.initPosition.call( this, data )
            laserMain.transforms.initRotation.call( this, data )
            laserMain.transforms.initScale.call( this, data )
    
            this.angleX = 
                this.defaults.angleX = 
                    laserMain.getValueOrDefault( 'angleX', data )

            this.angleY = 
                this.defaults.angleY = 
                    laserMain.getValueOrDefault( 'angleY', data )

            this.spin = 
                this.defaults.spin = 
                    laserMain.getValueOrDefault( 'spin', data )

        },
        initPosition( { x = 0, y = 0, z = 0 } ) {
            this.position.set( x, y, z )
        },
        initRotation( { rotX = 0, rotY = 0, rotZ = 0 } ) {
            this.rotation.set( rotX, rotY, rotZ  )
        },
        initScale( { scale = laserMain.defaults.scale } ) {
            this.scale.set( scale, scale, scale )
        },
    },
    
    // overall laser init called on first laser creation
    init() {
        this.hasInit = true

        this.createGradientCanvases()

        this.texture = new Texture( this.planeCanvas )
        this.texture.needsUpdate = true

        this.pointTexture = new Texture( this.pointCanvas )
        this.pointTexture.needsUpdate = true

        this.planeGeometry = new PlaneGeometry( 1, .1 )

        this.baseBoxGeometry = new BoxGeometry( .4, .25, .5 )
        this.baseBoxMaterial = new MeshPhongMaterial({
            color: 0x111111,
            side: FrontSide,
        })

        this.baseBox = new Mesh(
            this.baseBoxGeometry,
            this.baseBoxMaterial
        )
        this.baseBox.name = 'baseBox'

        this.raycaster = new Raycaster()
    },
    createGradientCanvases() {

        // plane linear gradient

        var c = document.createElement( 'canvas' )
                .getContext( '2d' )

        c.canvas.width = 1
        c.canvas.height = 64

        var g = c.createLinearGradient( 
            0, 0, c.canvas.width, c.canvas.height 
        )
        		
		g.addColorStop( 0 , 'rgba(0, 0, 0, 0)' )
		g.addColorStop( 0.35, 'rgba(50, 50, 50, 0.5)' )
		g.addColorStop( 0.5, 'rgba(255, 255, 255, 1)' )
		g.addColorStop( 0.65, 'rgba(50, 50, 50, 0.5)' )
		g.addColorStop( 1, 'rgba(0, 0, 0, 0)' )

        c.fillStyle = g
        c.fillRect( 0, 0, c.canvas.width, c.canvas.height )

        // point radial gradient

        var c2 = document.createElement( 'canvas' )
                .getContext( '2d' )
        
        c2.canvas.width = 64
        c2.canvas.height = 64

        var g2 = c2.createRadialGradient( 32, 32, 0,   32, 32, 32 )
        		
		g2.addColorStop( 0, 'rgba(255, 255, 255, 1)' )
		g2.addColorStop( 0.25, 'rgba(255, 255, 255, 1)' )
		g2.addColorStop( 0.5, 'rgba(255, 255, 255, .25)' )
		g2.addColorStop( 1, 'rgba(0, 0, 0, 0)' )

        c2.fillStyle = g2
        c2.fillRect( 0, 0, c2.canvas.width, c2.canvas.height )

        this.planeCanvas = c.canvas
        this.pointCanvas = c2.canvas
    },

    // main update
    clock: new Clock(),
    updateAll() {
        var time = laserMain.clock.elapsedTime
        var deltaTime = laserMain.clock.getDelta()


        time *= this.globalAnimationSpeed
        deltaTime *= this.globalAnimationSpeed

        for ( let laser of laserMain.all ) {
            this.update.call( laser, time, deltaTime )
        }
    },
    update( time, deltaTime ) {

        time *= this.speed
        deltaTime *= this.speed

        if ( this.animation ) {
            if ( typeof this.animation == 'string' ) {
                
                if ( !animMain.all[ this.animation ] ) {
                    laserMain.doUniqueError( 
                        `Laser Animation: Movement animation not found: `
                        + this.animation
                    )
                }
                else {
                    this.animation = 
                        animMain.all[ this.animation ]
                }
            }

            if ( this.animation.isLaserAnim )
                        
                laserMain.validateAnimationType(
                    'movement',
                    this.animation
                )
            
                animMain.run.call( this.animation, 
                    time, deltaTime, this 
                )
        }

        if ( this.colorAnimation ) {
            if ( typeof this.colorAnimation == 'string' ) {
                
                if ( !animMain.all[ this.colorAnimation ] ) {
                    laserMain.doUniqueError( 
                        `Laser Animation: Color animation not found: `
                        + this.colorAnimation
                    )
                }
                else {
                    this.colorAnimation = 
                        animMain.all[ this.colorAnimation ]
                }
            }

            if ( this.colorAnimation.isLaserAnim )

                laserMain.validateAnimationType(
                    'color',
                    this.colorAnimation
                )

                animMain.run.call( this.colorAnimation, 
                    time, deltaTime, this 
                )
        }
        
        this.updateSpreadAndSide()

        this.raycast.enabled && raycast.doRaycast.call( this )
    },
    validateAnimationType( type, animation ) {

        if ( type != animation.type ) {

            laserMain.doUniqueError( 
                `Laser Animation: Invalid animation type`
                + ` being used on property '${
                    type == 'color' ? 'colorA' : 'a'
                }nimation': `
                + ( animation.name ?
                    `Name: `+ animation.name : 
                    'unnamed' )
                + `. Type: ${ animation.type }`
            )
        }
    },

    // utilities
    initColorString() {
        return (
            `hsl(${ ( this.hue ) }, `
            + `${ this.convertedSaturation }%, `
            + `${ this.convertedLightness }%)`
        )
    },
    setBaseSpriteLightness() {
        this.baseSprite && 
            this.baseSprite.material.color.set( 
                // base sprite is always white
                `hsl(0, 0%, ${ this.convertedLightness * 2 }%)`
            )
    },
    getValueOrDefault( property, data ) {
        if ( !data ) return laserMain.defaults[ property ]

        else if ( data[ property ] !=  undefined ) 
            return data[ property ]

        else return laserMain.defaults[ property ]
    },
    doUniqueError: (function iIFE() {

        let uniqueErrors = []

        return function( error ){
            if ( uniqueErrors.includes( error ) ) return

            uniqueErrors.push( error )
            console.error( error )
        }
    })(),
    tempToClear: [],
    clearDisposed() {
        // clear all children backwards, order comes from traverse
        for ( let i = laserMain.tempToClear.length - 1; i >= 0; i-- ) {
            laserMain.tempToClear[ i ].clear()
        }
        laserMain.tempToClear = []

        // remove from laserMain.all array
        var index = laserMain.all.indexOf( this )

        if ( index == -1 ) 
            return console.error( 'This shouldnt happen lol' )

        laserMain.all.splice( index, 1 )

        // remove from groups
        for ( let id of this.groups ) {
            let objIndex = groupMain.all[ id ].lasers.indexOf( this )

            if ( objIndex == -1 ) 
                return console.error( 'This shouldnt happen lol' )

            groupMain.all[ id ].lasers.splice( objIndex, 1 )
        }

        // remove all configurable properties
        let properties = Object.getOwnPropertyDescriptors( this )
        for ( let key of Object.keys( properties ) ) {
            if ( properties[ key ].configurable ) delete this[ key ]
        }

        // remove these too
        delete this.modelViewMatrix.elements
        delete this.modelViewMatrix.isMatrix4
        this.modelViewMatrix.__proto__ = null

        delete this.normalMatrix.elements
        delete this.normalMatrix.isMatrix3
        this.normalMatrix.__proto__ = null

        this.__proto__ = null
        
        this.isDestroyed = true
    },
    disposeFn( item ) {
        if ( 
                item.type == 'Sprite' || 
                ( item.type == 'Mesh' && item.name != 'baseBox' )
            ) {
            item.material.dispose()
        }
        laserMain.tempToClear.push( item )
    },
    setBeamProperties( beamParent ) {

        // setting color properties
        // on beam parents

        let _hue = this.hue

        Object.defineProperty( beamParent, 'hue', {
            get: function() { return _hue },
            set: function( value ) {
                _hue = Math.round( value )
                if ( _hue < 0 ) _hue = Math.round(
                    _hue + Math.ceil( 
                        Math.abs( _hue / 360 ) 
                    ) * 360 
                )
                laserMain.setBeamParentHue.call( this )
            }
        })


        let _saturation = this.saturation

        Object.defineProperty( beamParent, 'saturation', {
            get: function() { return _saturation },
            set: function( value ) {
                _saturation = MathUtils.clamp( value, 0, 1 )
                laserMain.setBeamParentHue.call( this )
            }
        })


        let _lightness = this.lightness

        Object.defineProperty( beamParent, 'lightness', {
            get: function() { return _lightness },
            set: function( value ) {
                _lightness = MathUtils.clamp( value, 0, 1 )
                laserMain.setBeamParentHue.call( this )
            }
        })


        Object.defineProperty( beamParent, 'convertedSaturation', {
            get: function() { return Math.floor( _saturation * 100 ) },
        })


        Object.defineProperty( beamParent, 'convertedLightness', {
            get: function() { return Math.floor( _lightness * 100 ) }
        })
    },
    setBeamParentHue() {

        for ( let child of this.children ) {

            let material

            // check if child is sprite or planeParent

            // get sprite material
            if ( child.isSprite ) material = child.material 

            // get plane material
            else material = child.children[ 0 ].material 

            // called from the beamParent
            // when they set bP HSL
    
            // so the 'this' is the beamParent

            material.color.set( 
                `hsl(${ this.hue }, `
                + `${ this.convertedSaturation }%, `
                + `${ this.convertedLightness }%)` 
            )
        }
    },
    setBeamParentToLaserHSL( beamParent ) {
        beamParent.hue = this.hue
        beamParent.saturation = this.saturation
        beamParent.lightness = this.lightness
    },

    // laser builders
    createLaserWrap() {
        this.laserWrap = new Object3D()
        this.laserWrap.name = 'laserWrap'
    },
    createEachLaser( data ) {

        this.allPlaneParents = []
        this.allPointSprites = []
        this.allBeamParents = []

        // Create each laser 

        var count = laserMain.getValueOrDefault( 'count', data )

        for ( var j = 0; j < count; j++ ) {
            laserMain.createBeam.call( this, data )
        }

        // add wrap to self
        this.add( this.laserWrap )
    },
    createBeam( data = {} ) {
        const len = this.allBeamParents.length

        // parents
        const beamParent = new Object3D() // sprite and planeParent go in here
        beamParent.name = 'beamParent' + len
        laserMain.setBeamProperties.call( this, beamParent )

        const planeParent = new Object3D() // planes go in here
        planeParent.name = 'planeParent' + len
        
        // parent translate to point planes down z axis
        planeParent.rotation.y = Math.PI / 2

        // parent translations to stretch beam
        planeParent.scale.x = this.distance
        planeParent.position.z = planeParent.scale.x / 2

        // pointSprite for laser intersection (raycasting)
        const pointMaterial = new SpriteMaterial({
            map: laserMain.pointTexture,
            blending: AdditiveBlending,
            color: laserMain.initColorString.call( this ),
            depthWrite: false,
        })
        const pointSprite = new Sprite( pointMaterial )
        pointSprite.name = 'pointSprite' + len

        const spriteScale = .1 * this.thickness
        pointSprite.scale.set( spriteScale, spriteScale, spriteScale )
        pointSprite.visible = false

        // material for plane
        const planeMaterial = new MeshBasicMaterial({
            map: laserMain.texture,
            blending: AdditiveBlending,
            color: laserMain.initColorString.call( this ),
            side: DoubleSide,
            depthWrite: false,
        })

        // planes go in planeParent
        for ( var i = 0; i < 2; i++ ) {
            const mesh = new Mesh( laserMain.planeGeometry, planeMaterial )
            mesh.name = 'plane' + i
            mesh.rotation.x	= i * Math.PI / 2
            mesh.scale.y *= this.thickness
            planeParent.add( mesh )
        }

        // add to beamParent
        beamParent.add( planeParent )
        beamParent.add( pointSprite )

        // add to wrap
        this.laserWrap.add( beamParent )

        // push to arrays
        this.allPointSprites.push( pointSprite )
        this.allPlaneParents.push( planeParent )
        this.allBeamParents.push( beamParent )
    },
    createBaseBox( data ) {

        if ( !laserMain.getValueOrDefault( 'baseBox', data ) ) 
            return

        this.baseBox = laserMain.baseBox.clone()
        this.add( this.baseBox )

        this.baseBox.position.y = .125

        // adjust plane start point to box
        this.laserWrap.position.set( 0, .125, .25)

        // base sprite
        {
            const baseSpriteMaterial = new SpriteMaterial({
                map: laserMain.pointTexture,
                blending: AdditiveBlending,
            })
            this.baseSprite = new Sprite( baseSpriteMaterial )
            this.baseSprite.name = 'baseSprite'
        }

        {
            const spriteScale = .1 * this.thickness

            this.baseSprite.scale.set( 
                spriteScale, spriteScale, spriteScale 
            )
        }

        laserMain.setBaseSpriteLightness.call( this )
        this.baseSprite.position.z = .01

        this.laserWrap.add(this.baseSprite)
    },
    checkAddTo( data ) {
        let addTo = laserMain.getValueOrDefault( 'addTo', data )
        if ( addTo.isObject3D ) addTo.add( this )
    },
    removeLastBeam() {
        // used when count goes down
        
        const beam = this.allBeamParents[ this.allBeamParents.length - 1 ]
        var tempToClear = []

        beam.traverse( item => 
                tempToClear.push( item ) )

        for ( let i = tempToClear.length - 1; i >= 0; i-- ) {

            tempToClear[ i ].clear()

            tempToClear.material && 
                tempToClear.material.dispose()
        }

        this.allBeamParents.pop()
        this.allPointSprites.pop()
        this.allPlaneParents.pop()
    },

    // LaserObject init fns
    initSettings( data ) {
        // meta
        Object.defineProperty( this, 'isLaser', {
            value: true,
            writable: false,
            configurable: true,
        })
        
        Object.defineProperty( this, 'defaults', {
            value: {},
            configurable: true,
        })

        // raycast
        Object.defineProperty( this, 'raycast', {
            value: {
                objects: []
            },
            configurable: true,
        })

        // groups
        Object.defineProperty( this, 'groups', {
            value: [],
            configurable: true,
        })
    },
    initGettersSetters( data ) {

// HSL
        let _hue = 
            this.defaults.hue = 
                laserMain.getValueOrDefault( 'hue', data )
        
        Object.defineProperty( this, 'hue', {
            configurable: true,
            get: function() { return _hue },
            set: function( value ) {

                _hue = Math.round( value )

                if ( _hue < 0 ) _hue = Math.round(
                    _hue + Math.ceil( 
                        Math.abs( _hue / 360 ) 
                    ) * 360 
                )
        
                for ( let beamParent of this.allBeamParents ) {

                    laserMain.setBeamParentToLaserHSL.call(
                        this,
                        beamParent
                    )
                }
            }
        })

        let _saturation = 
            this.defaults.saturation = 
                laserMain.getValueOrDefault( 'saturation', data )

        Object.defineProperty( this, 'saturation', {
            configurable: true,
            get: function() { return _saturation },
            set: function( value ) {

                _saturation = MathUtils.clamp( value, 0, 1 )
        
                for ( let beamParent of this.allBeamParents ) {

                    laserMain.setBeamParentToLaserHSL.call(
                        this,
                        beamParent
                    )
                }
        
                laserMain.setBaseSpriteLightness.call( this )
            }
        })
        
        let _lightness = 
            this.defaults.lightness = 
                laserMain.getValueOrDefault( 'lightness', data )

        Object.defineProperty( this, 'lightness', {
            configurable: true,
            get: function() { return _lightness },
            set: function( value ) {

                _lightness = MathUtils.clamp( value, 0, 1 )
        
                for ( let beamParent of this.allBeamParents ) {

                    laserMain.setBeamParentToLaserHSL.call(
                        this,
                        beamParent
                    )
                }
        
                laserMain.setBaseSpriteLightness.call( this )
            }
        })

// BEAM
        let _distance = 
                laserMain.getValueOrDefault( 'distance', data )
        
        Object.defineProperty( this, 'distance', {
            configurable: true,
            get: function() { return _distance },
            set: function( value ) {

                _distance = value
        
                for ( let [ i ] of this.getBeamParents ) {
                    raycast.scaleBeamToFullDistance.call( this, i )
                    raycast.offsetBeamAfterScaling.call( this, i )
                }

                this.raycast.enabled && 
                    this.raycast.once()
            }
        })
        
        let _thickness = 
            this.defaults.thickness = 
                laserMain.getValueOrDefault( 'thickness', data )
        
        Object.defineProperty( this, 'thickness', {
            configurable: true,
            get: function() { return _thickness },
            set: function( value ) {
            
                const baseSpriteValue = value * .1
                this.baseSprite && this.baseSprite.scale.set( 
                    baseSpriteValue, 
                    baseSpriteValue, 
                    baseSpriteValue 
                )
        
                _thickness = value
                const spriteValue = value * .1
        
                for ( 
                    let [ i, planeParent ] of 
                        Object.entries( 
                            this.allPlaneParents 
                        ) 
                    ) {
        
                    this.allPointSprites[ i ].scale
                    .set( spriteValue, spriteValue, spriteValue )
        
                    for ( let plane of planeParent.children ) {
                        plane.scale.y = value
                    }
        
                }
            },
        })

        let _spread = 
            this.defaults.spread = 
                laserMain.getValueOrDefault( 'spread', data )

        Object.defineProperty( this, 'spread', {
            configurable: true,
            get: function() { return _spread },
            set: function( value ) { _spread = value }
        })

        let _side = 
            this.defaults.side = 
                laserMain.getValueOrDefault( 'side', data )

        Object.defineProperty( this, 'side', {
            configurable: true,
            get: function() { return _side },
            set: function( value ) { _side = value }
        })

// ANIMATION
        let _speed = 
            this.defaults.speed = 
                laserMain.getValueOrDefault( 'speed', data )
        
        Object.defineProperty( this, 'speed', {
            configurable: true,
            get: function() { return _speed },
            set: function( value ) { _speed = value }
        })

        let _animation = 
            this.defaults.animation = 
                laserMain.getValueOrDefault( 'animation', data )

        Object.defineProperty( this, 'animation', {
            configurable: true,
            get: function() { return _animation },
            set: function( value ) {
                // clear lastAnimation, so animMain.functionWrap
                // can detect 'init' when swapping to the same animation

                this.lastAnimation = null
                _animation = value
            }
        })

        let _colorAnimation = 
            this.defaults.colorAnimation = 
                laserMain.getValueOrDefault( 'colorAnimation', data )

        Object.defineProperty( this, 'colorAnimation', {
            configurable: true,
            get: function() { return _colorAnimation },
            set: function( value ) {
                // clear lastColorAnimation, so animMain.functionWrap
                // can detect 'init' when swapping to the same colorAnimation

                this.lastColorAnimation = null
                _colorAnimation = value
            }
        })
    },
    createLaser( data ) {

        laserMain.createLaserWrap.call( this )

        laserMain.createBaseBox.call( this, data )

        laserMain.createEachLaser.call( this, data )

        laserMain.checkAddTo.call( this, data )

    },
    postCreateInit( data ) {

        // spread / side
        this.updateSpreadAndSide()

        // transforms
        laserMain.transforms.init.call( this, data )

        // raycast once
        if ( laserMain.getValueOrDefault( 'raycastOnce', data ) ) {
            this.raycast.once()
        }

        // raycast.enabled setter
        let _raycastEnabled = laserMain.getValueOrDefault( 'raycast', data )

        Object.defineProperty( this.raycast, 'enabled', {
            set: function( bool ) {

                _raycastEnabled = !!bool

                if ( !bool ) {
                    for ( let pointSprite of this.allPointSprites ) {
                        pointSprite.visible = bool
                    }
                }
            }.bind( this ),
            get: function() { return _raycastEnabled }
        })

        // point at
        const target = laserMain.getValueOrDefault( 'pointAt', data )
        this.defaults.pointAt = target
        target && this.pointAt( target )
    },
    initRaycastFns( data ) {

        this.raycast.add = raycast.add.bind( this )
        this.raycast.remove = raycast.remove.bind( this )

        this.raycast.once = () => setTimeout( raycast.doRaycast.bind( this ) )
    },
}
class LaserObject extends Object3D {
    constructor( data = {} ) {
        super()

        if ( !laserMain.hasInit ) laserMain.init()

        laserMain.initSettings.call( this, data )
        laserMain.initRaycastFns.call( this, data )
        laserMain.initGettersSetters.call( this, data )
        laserMain.createLaser.call( this, data )
        laserMain.postCreateInit.call( this, data )

        laserMain.all.push( this )
    }
    updateSpreadAndSide = (function iIFE() { 

        var _lastSide = 0
        var _lastSpread = 0

        return function updateSpreadAndSideInner() {

            if ( this.side === _lastSide && 
                this.spread === _lastSpread ) return

            _lastSide = this.side
            _lastSpread = this.spread

            var len = this.allBeamParents.length
            var offset = .5 / len // used to center all of the planes

            for ( const [ i, beamParent ] of this.getBeamParents ) {

                const t = i / len // get current index interpolation value

                const rawValue = 
                    (
                        // interpolation offset * half circle
                        ( t + offset ) * Math.PI 

                        // offset -90 degrees for z forward
                        + Math.PI / -2 

                        // spread value
                    ) * this.spread 

                        // side value
                    + ( Math.PI * this.side * ( .47 + this.spread / 2 ) ) 

                // little less than half circle
                const clampedValue = MathUtils.clamp( rawValue, -1.5, 1.5 ) 

                // only show non-clamped planes
                beamParent.visible = !( Math.abs( clampedValue ) == 1.5 ) 

                beamParent.rotation.y = clampedValue
            }
        }
    })()
    update() {
        this.updateSpreadAndSide()

        this.raycast.enabled && 
            this.raycast.once()
    }
    reset( zero ) {
        if ( zero === 0 ) {
            this.angleX = 0
            this.angleY = 0
            this.spin = 0
            this.side = 0
            this.spread = 0
        }
        else {
            this.angleY = this.defaults.angleY
            this.angleX = this.defaults.angleX
            this.spin = this.defaults.spin
            this.side = this.defaults.side
            this.spread = this.defaults.spread
            
            this.defaults.pointAt &&
                this.pointAt( this.defaults.pointAt )
        }
        this.update()
    }
    resetColor( zero ) {
        if ( zero === 0 ) {
            this.hue = 0
            this.saturation = 1
            this.lightness = .5
        }
        else {
            this.hue = this.defaults.hue
            this.saturation = this.defaults.saturation
            this.lightness = this.defaults.lightness
        }
    }
    resetAnimation( zero ) {
        if ( zero === 0 ) {
            this.speed = 1
            this.animation = null
            this.colorAnimation = null 
        }
        else {
            this.speed = this.defaults.speed
            this.animation = this.defaults.animation
            this.colorAnimation = this.defaults.colorAnimation
        }
    }
    pointAt( objOrVec3 ) {
        this.laserWrap.lookAt( 
            objOrVec3.isVector3 ?
            objOrVec3 :
            objOrVec3.position 
        )
    }
    addTo( what ) { what.add( this ) }
    destroy() {
        this.removeFromParent()
        this.traverse( laserMain.disposeFn )

        laserMain.clearDisposed.call( this )

    }
    apply( pose ) {
        if ( !pose.isLaserPose ) 
            return console.error( 
                `Laser Apply: Invalid pose: ${ pose }`
            )

        pose.apply( this )
    }

// viibility things
    get enabled() { return this.laserWrap.visible }
    get convertedLightness() { return Math.floor( this.lightness * 100 )}
    get convertedSaturation() { return Math.floor( this.saturation * 100 )}
// laserWrap rotation getters
    get angleX() { return this.laserWrap.rotation.x * -1 }
    get angleY() { return this.laserWrap.rotation.y }
    get spin() { return this.laserWrap.rotation.z }

    get getBeamParents() {
        // returns [ index, beamParent ]
        return Object.entries(this.allBeamParents)
    }
// laser setters
    set enabled( bool ) {
        this.laserWrap.visible = bool
    }
// laserWrap rotation setters
    set angleX( value ) {
        this.laserWrap.rotation.x = value * -1
    }
    set angleY( value ) {
        this.laserWrap.rotation.y = value
    }
    set spin( value ) {
        this.laserWrap.rotation.z = value
    }
// beam count
    get count() { return this.allBeamParents.length }
    set count( value ) {
        value = Math.floor( value )
        var dif = value - this.count
        if ( !dif ) return

        if ( dif > 0 ) {
            for ( let x = 0; x < dif; x++ ) {
                laserMain.createBeam.call( this )
            }
        }
        else {
            for ( let x = dif; x < 0; x++ ) {
                laserMain.removeLastBeam.call( this )
            }
        }
    }
}

const groupMain = {
    all: {},
    validateLaser( laserObj ) {
        if ( !laserObj.isLaser ) 
            console.error( 
                `Laser Group: Can't add a non-laser: ${laserObj}`
            )
        else return true
    },
    parseInitData( data ) {
        const laserArray = []

        // for each argument sent to group init

        for ( let objOrAry of data ) {

            // array of lasers

            if ( Array.isArray( objOrAry ) ) {

                for ( let laser of objOrAry ) {
                    // add group id to laser
                    if ( groupMain.validateLaser( laser ) )
                        laser.groups.push( this.id )

                    // add to laserArray if unique
                    if ( !laserArray.includes( objOrAry ) )
                        laserArray.push( laser )
                }
            }

            // single laser

            else if ( groupMain.validateLaser( objOrAry ) ) {

                // add group id to laser
                if ( !objOrAry.groups.includes( this.id ) )
                    objOrAry.groups.push( this.id )
                    
                // add to laserArray if unique
                if ( !laserArray.includes( objOrAry ) )
                    laserArray.push( objOrAry )
            }
        }

        // set array to group object
        this.lasers = laserArray
    },
    each( property, value ) {
        for ( let laserObj of this.lasers ) {
            laserObj[ property ] = value
        }
    },
    nestEach( property1, property2, value ) {
        for ( let laserObj of this.lasers ) {
            laserObj[ property1 ][ property2 ] = value
        }
    },
    fnEach( fn, ...values ) {
        for ( let laserObj of this.lasers ) {
            laserObj[ fn ]( ...values )
        }
    },
    validateAndAdd( laserObj ) {
        if ( 
                groupMain.validateLaser( laserObj ) &&
                !this.lasers.includes( laserObj )
            ) {
                laserObj.groups.push( this.id )
                this.lasers.push( laserObj )
            }
    },
    findAndRemove( laserObj ) {
        var objIndex = this.lasers.indexOf( laserObj )
        if ( objIndex == -1 ) return

        var groupIndex = laserObj.groups.indexOf( this.id )
        if ( groupIndex == -1 ) return

        laserObj.groups.splice( groupIndex, 1 )

        this.lasers.splice( objIndex, 1 )
    },
}
const groupObject = {
    init( ...data ) {
        this.id = MathUtils.generateUUID()

        groupMain.parseInitData.call( this, data )

        groupMain.all[ this.id ] = this

        Object.defineProperty( this, 'isLaserGroup', {
            value: true,
            writable: false,
        })

        return this
    },
    pointAt( obj3d ) {
        groupMain.fnEach.call( this, 'pointAt', obj3d )
    },
    reset( zero ) {
        groupMain.fnEach.call( this, 'reset', zero )
    },
    resetColor( zero ) {
        groupMain.fnEach.call( this, 'resetColor', zero )
    },
    resetAnimation( zero ) {
        groupMain.fnEach.call( this, 'resetAnimation', zero )
    },
    addTo( what ) {
        groupMain.fnEach.call( this, 'addTo', what )
    },
    add( ...array ) {
        for ( let laserOrArray of array ) {

            if ( Array.isArray( laserOrArray ) ) {

                for ( let laser of laserOrArray ) {
                    groupMain.validateAndAdd.call( this, laser )
                }
                
            }
            else groupMain.validateAndAdd.call( this, laserOrArray )
        }
    },
    remove( ...array ) {
        for ( let laserOrArray of array ) {

            if ( Array.isArray( laserOrArray ) ) {

                for ( let laser of laserOrArray ) {
                    groupMain.findAndRemove.call( this, laser )
                }
            }

            else groupMain.findAndRemove.call( this, laserOrArray )
        }
    },
    removeAll() {
        for ( let laser of this.lasers ) {
            var groupIndex = laser.groups.indexOf( this.id )
            if ( groupIndex == -1 ) continue
    
            laser.groups.splice( groupIndex, 1 )
        }

        this.lasers = []
    },
    apply( pose ) {
        pose.apply( this )
    },
    destroy() {
        for ( let i = this.lasers.length - 1; i >= 0; i-- ) {
            this.lasers[ i ].destroy()
        }
    },
    update() {
        groupMain.fnEach.call( this, 'update' )
    },
    updateSpreadAndSide() {
        groupMain.fnEach.call( this, 'updateSpreadAndSide' )
    },

// animation setters
    set animation( value ) {
        groupMain.each.call( this, 'animation', value )
    },
    set colorAnimation( value ) {
        groupMain.each.call( this, 'colorAnimation', value )
    },
    set speed( value ) {
        groupMain.each.call( this, 'speed', value )
    },

// laser setters
// visibility things
    set lightness( value ) {
        groupMain.each.call( this, 'lightness', value )
    },
    set saturation( value ) {
        groupMain.each.call( this, 'saturation', value )
    },
    set hue( value ) {
        groupMain.each.call( this, 'hue', value )
    },
    set enabled( bool ) {
        groupMain.each.call( this, 'enabled', bool )
    },
    set distance( value ) {
        groupMain.each.call( this, 'distance', value )
    },
    set thickness( value ) {
        groupMain.each.call( this, 'thickness', value )
    },
    set spread( value ) {
        groupMain.each.call( this, 'spread', value )
    },
    set side( value ) {
        groupMain.each.call( this, 'side', value )
    },
    set count( value ) {
        groupMain.each.call( this, 'count', value)
    },

// laserWrap rotation setters
    set angleX( value ) {
        groupMain.each.call( this, 'angleX', value )
    },
    set angleY( value ) {
        groupMain.each.call( this, 'angleY', value )
    },
    set spin( value ) {
        groupMain.each.call( this, 'spin', value )
    },

// raycast
    set raycast ( bool ) {
        groupMain.nestEach.call( this, 'raycast', 'enabled', bool )
    }
}


const poseMain = {
    validOptions: [
        'hue',
        'side',
        'spin',
        'speed',
        'count',
        'spread',
        'angleX',
        'angleY',
        'enabled',
        'thickness',
        'animation',
        'lightness',
        'saturation',
        'colorAnimation',
    ],
    extraProperties: [
        'resetOnApply',
        'resetColorOnApply',
        'resetAnimationOnApply'
    ],
    validatePose( pose ) {

        if ( poseMain.validOptions.includes( pose ) ) return true

        else console.error( 
            `Laser Pose: Invalid pose property: ${ pose }` 
        )

    },
    validateAndParseData( data ) {

        this.pose = {}

        for ( let [ key, value ] of Object.entries( data ) ) {

            if  ( poseMain.extraProperties.includes( key ) ) 
                this[ key ] = value

            else if ( poseMain.validatePose( key ) ) 
                this.pose[ key ] = value
        }
    },
    applyPose( laser ) {
        if ( this.resetOnApply ) laser.reset()
        else if ( this.resetOnApply === 0 ) laser.reset( 0 )
        
        if ( this.resetColorOnApply ) laser.resetColor()
        else if ( this.resetColorOnApply === 0 ) laser.resetColor( 0 )
        
        if ( this.resetAnimationOnApply ) laser.resetAnimation()
        else if ( this.resetAnimationOnApply === 0 ) laser.resetAnimation( 0 )

        for ( let [ key, value ] of this.entries ) {

            laser[ key ] = value
        }

        laser.update()
    },
    checkGroupOrLaserThenApply( laserOrGroup ) {
        if ( laserOrGroup.isLaser ) 
            poseMain.applyPose.call( this, laserOrGroup )

        else if ( laserOrGroup.isLaserGroup )
            poseMain.applyGroupPose.call( this, laserOrGroup )
    },
    applyGroupPose( group ) {
        for ( let laser of group.lasers ) 
            poseMain.applyPose.call( this, laser )
    },
}
const poseObject = {
    init( data = {} ) {

        Object.defineProperty( this, 'isLaserPose', {
            value: true,
            writable: false,
        })

        poseMain.validateAndParseData.call( this, data )

        return this
    },
    apply( ...laserOrGroups ) {

        for ( let laserOrGroup of laserOrGroups ) {

            if ( Array.isArray( laserOrGroup ) ) {

                for ( let nestedLaserOrGroup of laserOrGroup) {

                    poseMain.checkGroupOrLaserThenApply
                    .call( this, nestedLaserOrGroup )
                }
            }
            else {
                poseMain.checkGroupOrLaserThenApply
                .call( this, laserOrGroup )
            }
        }
    },
    get entries() { return Object.entries( this.pose ) }
}
// fill poseObject with getters/setters for pose options
for ( let option of poseMain.validOptions ) {

    Object.defineProperty( poseObject, option, {
        get: function() { return this.pose[ option ] },
        set: function( value ) { 
            if ( value === null ) delete this.pose[ option ]
            else this.pose[ option ] = value
        }
    })
}


const presetMain = {
    validOptions: [
        'pose',
        'target',
        'animation',
        'colorAnimation',
    ],
    dataIsInvalid( data ) {
        var failedTest = false

        for ( let setting of data ) {

            // validate target existing
            if ( !setting.target ) {
                console.error( 
                    `Laser Preset: Missing required target`
                )
                failedTest = true
            }

            // validate target type
            else if ( 
                !setting.target.isLaser &&
                !setting.target.isLaserGroup
            ) {
                console.error( 
                    `Laser Preset: Target must be `
                    + `a laser or a laser group.`
                )
                failedTest = true
            }

            // validate at least one pose, animation, or colorAnimation
            if (
                    !setting.pose &&
                    setting.animation === undefined &&
                    setting.colorAnimation === undefined
            ) {
                console.error( 
                    `Laser Preset: Requires at least one: `
                    + `pose, animation, or colorAnimation`
                )
                failedTest = true
            }

            // if pose exists, validate pose type
            if ( setting.pose && !setting.pose.isLaserPose ) {
                console.error( 
                    `Laser Preset: Invalid pose:`, setting.pose 
                )
                failedTest = true
            }
        }

        return failedTest
    },
    parseAndValidateData( data ) {
        this.settings = []

        for ( let setting of data ) {

            let parsedSetting = {}

            for ( let [ key, value ] of Object.entries( setting ) ) {

                if ( presetMain.validateOption( key ) )
                    parsedSetting[ key ] = value

            }

            this.settings.push( parsedSetting )
        }
    },
    validateOption( option ) {
        if ( presetMain.validOptions.includes( option ) ) 
            return true

        else console.error( 
            `Laser Preset: Invalid option: ${ option }`
        )
    },
    doApply( setting ) {
        
        // apply pose
        if ( setting.pose ) setting.pose.apply( setting.target )

        // apply animation values
        for ( let [ key, value ] of Object.entries( setting ) ) {
            
            if ( !presetMain.validateOption( key ) ) continue

            if ( key != 'animation' && key != 'colorAnimation' ) continue

            setting.target[ key ] = value
        }
    },
    dispatchApply( presetSetting ) {

        // apply to lasers
        if ( presetSetting.target.isLaser )
            presetMain.doApply( presetSetting )

        // apply to each laser in group
        else if ( presetSetting.target.isLaserGroup ) {

            for ( let laser of presetSetting.target.lasers ) {

                let newSetting = { 
                    ...presetSetting,
                    target: laser
                }

                presetMain.doApply( newSetting )
            }
        }
    },
    applyPreset() {
        for ( let presetSetting of this.settings ) {

            // allows sending array of groups or lasers
            // as a target, instead of just one
            if ( Array.isArray( presetSetting.target ) ) {

                for ( let laserOrGroup of presetSetting.target ) {

                    let newSetting = { 
                        ...presetSetting,
                        target: laserOrGroup
                    }

                    presetMain.dispatchApply( newSetting )
                }
            }

            // not array, apply to single target
            else presetMain.dispatchApply( presetSetting )
        }
    }
}
const presetObject = {
    init( ...data ) {
        if ( presetMain.dataIsInvalid( data ) ) return

        presetMain.parseAndValidateData
        .call( this, data )
        
        Object.defineProperty( this, 'isLaserPreset', {
            value: true,
            writable: false,
        })

        return this
    },
    apply() {
        presetMain.applyPreset.call( this )
    }
}


const animMain = {
    all: {},
    validOptions: [
        'name',
        'type',
        'fn'
    ],

    // init functions
    typeIsInvalid( { type } ) {
        if ( type == 'color' || type == 'movement' ) return false

        console.error(
            `Laser Animation: Type must be 'color' or 'movement'`
        )
        return true
    },
    nameIsInvalid( { name } ) {
        // no name is no problem
        if ( name == undefined ) return false

        // name must be a string
        if ( typeof name != 'string' ) {
            console.error(
                `Laser Animation: Name must be a string: ${ name }`
            )
            return true
        } 

        // name must not already exist
        var found = this.all[ name ]
        if ( found ) {
            console.error(
                `Laser Animation: Name already exists: ${ name }`
            )
            return true
        } 

        // passed
        return false
    },
    fnIsInvalid( { fn } ) {
        if ( typeof fn != 'function' ) {
            console.error(
                `Laser Animation: fn: type must be function`
            )
            return true
        }
        else return false
    },
    dataIsInvalid( data ) {
        if ( 
            animMain.nameIsInvalid( data ) ||
            animMain.typeIsInvalid( data ) ||
            animMain.fnIsInvalid( data )
        ) return true
    },
    parseData( data ) {
        
        Object.defineProperty( this, 'isLaserAnim', {
            value: true,
            writable: false,
        })

        for ( let [ key, value ] of Object.entries( data ) ) {

            if ( animMain.validOptions.includes( key ) ) {
                this[ key ] = value
            }
            else console.error(
                `Laser Animation: Invalid option: ${ key }`
            )
        }
    },

    // animation stuff
    functionWrap( time, deltaTime, laser ) {
        let init = false

        if ( this.type == 'movement' ) {

            if ( laser.lastAnimation != laser.animation ) {

                init = true
                laser.lastAnimation = laser.animation
            }
        }

        else if ( this.type == 'color' ) {

            if ( laser.lastColorAnimation != laser.colorAnimation) {

                init = true
                laser.lastColorAnimation = laser.colorAnimation
            }
        }

        this.fn.call( laser, { time, deltaTime, init } )
    },
    run( ...data ) {
        animMain.functionWrap.call( this, ...data )
    },
}
const animObject = {
    init( data = {} ) {
        if ( animMain.dataIsInvalid.call( this, data ) ) return

        animMain.parseData.call( this, data )

        if ( this.name != undefined )
            animMain.all[ this.name ] = this

        return this
    },
}


const raycast = {
    nonObj3DErr( obj ) {
        console.error( 
            `Laser Raycast: Can't add a non-Object3D: `, 
            obj
        )
    },
    // LOCAL
    localValidateAndAddRaycastObject( obj3d ) {
        if ( !obj3d.isObject3D ) return raycast.nonObj3DErr( obj3d )
        if ( this.raycast.objects.includes( obj3d ) ) return
        else this.raycast.objects.push( obj3d )
    },
    localRemoveRaycastObject( obj3d ) {
        var index = this.raycast.objects.indexOf( obj3d )
        if ( index != -1 ) this.raycast.objects.splice( index, 1 )
    },
    // GLOBAL
    globalValidateAndAddRaycastObject( obj3d ) {
        if ( !obj3d.isObject3D ) return raycast.nonObj3DErr( obj3d )
        if ( laserMain.globalRaycastObjects.includes( obj3d ) ) return
        else laserMain.globalRaycastObjects.push( obj3d )
    },
    globalRemoveRaycastObject( obj3d ) {
        var index = laserMain.globalRaycastObjects.indexOf( obj3d )
        if ( index != -1 ) laserMain.globalRaycastObjects.splice( index, 1 )
    },

    add( ...array ) {

        // adds obj3d or array of obj3ds to check against when raycasting
        for ( let obj3dOrArray of array ) {

            if ( Array.isArray( obj3dOrArray ) ) {

                for ( let obj3d of obj3dOrArray ) {

                    raycast.localValidateAndAddRaycastObject
                    .call( this, obj3d )
                }
            }

            else {
                raycast.localValidateAndAddRaycastObject
                .call( this, obj3dOrArray )
            }
        }
    },
    remove( ...array ) {

        for ( let obj3dOrArray of array ) {

            if ( Array.isArray( obj3dOrArray ) ) {

                for ( let obj3d of obj3dOrArray ) {

                    raycast.localRemoveRaycastObject
                    .call( this, obj3d )
                }
            }
            else {
                raycast.localRemoveRaycastObject
                .call( this, obj3dOrArray )
            }
        }
    },
    addGlobal( ...array ) {

        for ( let obj3dOrArray of array ) {
            
            if ( Array.isArray( obj3dOrArray ) ) {

                for ( let obj3d of obj3dOrArray ) {

                    raycast.globalValidateAndAddRaycastObject( obj3d )
                }
            }
            else raycast.globalValidateAndAddRaycastObject( obj3dOrArray )
        }
    },
    removeGlobal( ...array ) {

        for ( let obj3dOrArray of array ) {
            
            if ( Array.isArray( obj3dOrArray ) ) {

                for ( let obj3d of obj3dOrArray ) {

                    raycast.globalRemoveRaycastObject( obj3d )
                }
            }
            else raycast.globalRemoveRaycastObject( obj3dOrArray )
        }
    },
    scaleBeamToFullDistance( i ) {

        this.allPlaneParents[ i ].scale.x = 
            this.distance / this.scale.x
        
        this.allPointSprites[ i ].visible = false
    },
    offsetBeamAfterScaling( i ) {

        // offset plane parent by half of scale
        // so that end point matches beamParent point

        this.allPlaneParents[ i ].position.z = 
            this.allPlaneParents[ i ].scale.x / 2
    },
    doRaycast() {
        if ( !this.isLaser ) return

        var len = this.allBeamParents.length

        for ( var i = 0; i < len; i++ ) {

            this.allBeamParents[i].updateMatrixWorld()

            // raycast from beamParent position out the Z axis
            var matrixClone = this.allBeamParents[i].matrixWorld.clone()
            laserMain.raycaster.far = this.distance
            laserMain.raycaster.ray.origin.setFromMatrixPosition( matrixClone )
            matrixClone.setPosition( new Vector3( 0, 0, 0 ) )
            laserMain.raycaster.ray.direction.set( 0, 0, 1 )
                .applyMatrix4( matrixClone )
                .normalize()

            // check intersections
            var intersects = 
                laserMain.raycaster.intersectObjects( 
                    [ 
                        ...laserMain.globalRaycastObjects, 
                        ...this.raycast.objects 
                    ] 
                )

            // set planeParent and pointSprite based on intersection
            if ( intersects.length ) {

                this.allPlaneParents[ i ].scale.x = 
                    MathUtils.clamp( 
                        intersects[ 0 ].distance, 
                        0, 
                        this.distance 
                    ) / this.scale.x

                this.allPointSprites[ i ].position.z = 
                    this.allPlaneParents[ i ].scale.x - .01

                this.allPointSprites[ i ].visible = true
            }

            // no intersections, set distance to default
            else {
                raycast.scaleBeamToFullDistance.call( this, i )
            }

            raycast.offsetBeamAfterScaling.call( this, i )
        }
    }
}


const laserParty = {
    new( data ) { return new LaserObject( data ) },
    pose( data ) { return Object.create( poseObject ).init( data ) },
    anim( data ) { return Object.create( animObject ).init( data ) },
    group( ...data ) { return Object.create( groupObject ).init( ...data ) },
    preset( ...data ) { return Object.create( presetObject ).init( ...data ) },

    updateAll: laserMain.updateAll.bind( laserMain ),

    raycast: {
        addGlobal: raycast.addGlobal,
        removeGlobal: raycast.removeGlobal
    },
    get globalAnimationSpeed() { return laserMain.globalAnimationSpeed },
    set globalAnimationSpeed( speed ) { laserMain.globalAnimationSpeed = speed },

    defaults: { 
        /* this object is also filled with getters & setters for individual defaults */ 
        set( obj ) {
            for ( let [ key, value ] of Object.entries( obj ) ) {

                // if the property exists in laserMain.defaults, update it
                if ( key in laserMain.defaults ) {
                    laserMain.defaults[ key ] = value
                }
                // if property doesn't exist, 
                // group log the valid options
                else {
                    let validOptions = Object.keys( laserMain.defaults ).reduce(
                        ( a, c ) => 
                            `${ a }   ${ c } ( ${ ( typeof laserMain.defaults[ c ] ) } )\n`,
                            '\n'
                    )
                    console.groupCollapsed( 
                        '%cLaser Defaults: Invalid default option: '
                        + `"${ key }" ( click for valid options )`, 

                        'color: #ff8080; background-color: #290000; padding:'
                        + '3px; padding-left: 6px; padding-right: 6px;'
                    )
                        console.log( 'Valid options: ', validOptions )
                    console.groupEnd()
                }
            }
        }
    }
}
// fill laserParty.defaults with getters & setters for laserMain.defaults
for ( let key in laserMain.defaults ) {

    if ( key == 'addTo' ) {

        Object.defineProperty( laserParty.defaults, key, {
            get: function() { return laserMain.defaults.addTo },
            set: function( value ) {
                if ( value ) laserMain.defaults.addTo = value
                else laserMain.defaults.addTo = {}
            }
        })

        continue
    }

    Object.defineProperty( laserParty.defaults, key, {
        get: function() { return laserMain.defaults[ key ] },
        set: function( value ) { laserMain.defaults[ key ] = value }
    })
}

export default laserParty
export { LaserObject as Laser }


{ // example animations
    // Movement
    laserParty.anim({
        name: 'exampleMovement',
        type: 'movement',
        fn( { time } ) {

            this.angleX = Math.sin( time ) * .2
            this.angleY = Math.cos( time ) * .2
        }
    })
    // Color
    laserParty.anim({
        name: 'exampleColor',
        type: 'color',
        fn( { time } ) {
            
            this.hue = ( Math.sin( time ) * .5 + .5 ) * 180
        }
    })
    // Hue
    laserParty.anim({
        name: 'exampleHue',
        type: 'color',
        fn( { deltaTime } ) {
            
            this.hue += deltaTime * 100
        }
    })
    // Saturation
    laserParty.anim({
        name: 'exampleSaturation',
        type: 'color',
        fn( { time } ) {
            
            this.saturation = Math.sin( time ) * .5 + .5
        }
    })
    // Lightness
    laserParty.anim({
        name: 'exampleLightness',
        type: 'color',
        fn( { time } ) {

            this.lightness = Math.sin( time ) * .5 + .5
        }
    })
    // Side
    laserParty.anim({
        name: 'exampleSide',
        type: 'movement',
        fn( { deltaTime, init } ) {

            if ( init ) {
                this.spread = 1
                this.side = -1.25
            }

            this.side += deltaTime * .5
            if ( this.side > 1.25 ) this.side = -1.25
        }
    })
    // Spread
    laserParty.anim({
        name: 'exampleSpread',
        type: 'movement',
        fn( { time } ) {

            this.spread = Math.sin( time ) * 1.5
        }
    })
    // Spin
    laserParty.anim({
        name: 'exampleSpin',
        type: 'movement',
        fn( { deltaTime } ) {

            this.spin += deltaTime
        }
    })
    // AngleX
    laserParty.anim({
        name: 'exampleAngleX',
        type: 'movement',
        fn( { deltaTime } ) {

            this.angleX += deltaTime
        }
    })
    // AngleY
    laserParty.anim({
        name: 'exampleAngleY',
        type: 'movement',
        fn( { deltaTime } ) {

            this.angleY += deltaTime
        }
    })
}