"use strict";

THREE.Points.prototype.raycast = function()
{
	var inverseMatrix = new THREE.Matrix4();
	var ray = new THREE.Ray();
	var sphere = new THREE.Sphere();

	return function raycast(raycaster, intersects)
	{
		var object = this;
		var geometry = this.geometry;
		var matrixWorld = this.matrixWorld;
		var threshold = raycaster.params.Points.threshold;

		//Checking boundingSphere distance to ray
		if(geometry.boundingSphere === null)
		{
			geometry.computeBoundingSphere();
		}

		sphere.copy(geometry.boundingSphere);
		sphere.applyMatrix4(matrixWorld);
		sphere.radius += threshold;

		if(raycaster.ray.intersectsSphere(sphere) === false)
		{
			return;
		}

		//Apply inverse transform on ray to check it againt local positions
		inverseMatrix.getInverse(matrixWorld);
		ray.copy(raycaster.ray).applyMatrix4(inverseMatrix);

		var localThreshold = threshold / ((this.scale.x + this.scale.y + this.scale.z) / 3);
		var localThresholdSq = localThreshold * localThreshold;
		var position = new THREE.Vector3();
		var intersectPoint = new THREE.Vector3();

		function testPoint(point, index)
		{
			var rayPointDistanceSq = ray.distanceSqToPoint(point);

			if(rayPointDistanceSq < localThresholdSq)
			{
				ray.closestPointToPoint(point, intersectPoint);
				intersectPoint.applyMatrix4(matrixWorld);

				var distance = raycaster.ray.origin.distanceTo(intersectPoint);

				if(distance < raycaster.near || distance > raycaster.far)
				{
					return;
				}

				intersects.push(
				{
					distance: distance,
					distanceToRay: Math.sqrt(rayPointDistanceSq),
					point: intersectPoint.clone(),
					index: index,
					face: null,
					object: object
				});
			}
		}

		if(geometry.isBufferGeometry)
		{
			var index = geometry.index;
			var attributes = geometry.attributes;
			var positions = attributes.position.array;

			if(index !== null)
			{
				var indices = index.array;

				for(var i = 0, il = indices.length; i < il; i ++)
				{
					var a = indices[i];
					position.fromArray(positions, a * 3);
					testPoint(position, a);
				}
			}
			else
			{
				for(var i = 0, l = positions.length / 3; i < l; i ++)
				{
					position.fromArray(positions, i * 3);
					testPoint(position, i);
				}
			}
		}
		else
		{
			var vertices = geometry.vertices;
			for(var i = 0, l = vertices.length; i < l; i ++)
			{
				testPoint(vertices[i], i);
			}
		}
	};
}();