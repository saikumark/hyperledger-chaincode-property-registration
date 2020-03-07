'use strict';

const {Contract} = require('fabric-contract-api');

/**
 * @description Smart contract for Registrar who plays important role in approving and auditing requests made by the user in the network
 */
class PropRegRegistrarContract extends Contract {

	/**
	 * @description Initiate constructor with smart contract name for registrar
	 */
	constructor() {
		// Provide a custom name to refer to this smart contract
		super('org.property-registration-network.regnet.registrar');
	}

	// 
	/**
	 * @description Method will be called while instantiating the smart contract to print the success message on console and set few initial set of variables.
	 * @param {*} ctx - Transaction context object
	 */
	async instantiate(ctx) {
		console.log('Smart Contract for Registrar Instantiated');
	}

	/**
	 * @description Approve new user request made in the network by user
	 * @param {*} ctx The transaction context object
	 * @param {*} name Name of the user
	 * @param {*} aadharId Aadhar Id of the user
	 * @returns Updated user object
	 */
	async approveNewUser(ctx, name, aadharId) {
		// Construct composite key for the given user account
		const userKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users', [name, aadharId]);

		//fetch user details from ledger based on user request key generated above.
		let userBuffer = await ctx.stub
				.getState(userKey)
				.catch(err => console.log(err));

		//Update user object with new properties
		let updatedUserObject = JSON.parse(userBuffer.toString());
		
		//If the user is already registered in the network reject the transaction
		if(updatedUserObject.status === 'Approved'){
			throw new Error('Duplicate Request: User is already registered in the network, request will be rejected');
		}
		else{
			updatedUserObject.upgradCoins = parseInt(0);
			updatedUserObject.updatedAt = new Date(); //For audit purpose
			updatedUserObject.registrarId = ctx.clientIdentity.getID(); //For audit purpose and to identify who has approved the request
			updatedUserObject.status = 'Approved'; //To differentiate between approved and non-approved user.
	
			// Convert the JSON object to a buffer and send it to blockchain for storage
			let dataBuffer = Buffer.from(JSON.stringify(updatedUserObject));
			await ctx.stub.putState(userKey, dataBuffer);
	
			// Return updated user object
			return updatedUserObject;
	
		}
	}

	/**
	 * @description Method to view user details in the network
	 * @param {*} ctx The transaction context object
	 * @param {*} name Name of the user
	 * @param {*} aadharId Aadhar Id of the user
	 */
	async viewUser(ctx, name, aadharId){
		//create composite key for the user
		const userKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users', [name, aadharId]);


		//using composite key fetch the current state of user object and return
		let userBuffer = await ctx.stub
				.getState(userKey)
				.catch(err => console.log(err));

		//user details registered in the network
		let userObject = JSON.parse(userBuffer.toString());

		//return the user detail
		return userObject;

	}

	/**
	 * @description Approve the property registration request by the user.  This makes property status as 'registered' which means the property is trusted property in the network
	 * @param {*} ctx The transaction context object
	 * @param {*} propertyId Unique property id of the property
	 * @returns Updated property detail
	 */
	async approvePropertyRegistration(ctx, propertyId){

		//create composite key for the property id given from request namespace.
		const propertyKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users.property', [propertyId]);

		//fetch the request for registration to the above compsite key.
		let propertyBuffer = await ctx.stub
				.getState(propertyKey)
				.catch(err => console.log(err));

		let propertyObject = JSON.parse(propertyBuffer.toString());

		//Update property object with few more details
		propertyObject.status='registered';
		propertyObject.approvedBy = ctx.clientIdentity.getID();
		propertyObject.updatedAt = new Date();

		//update property details in ledger.
		let propertyDataBuffer = Buffer.from(JSON.stringify(propertyObject));
		await ctx.stub.putState(propertyKey, propertyDataBuffer);

		// Returns updated property object
		return propertyObject;

	}

	/**
	 * @description View property details available in the network.
	 * @param {*} ctx The transaction context object
	 * @param {*} propertyId Unique property id of the property 
	 * @returns Property details available in the network
	 */
	async viewProperty(ctx, propertyId){

		//create composite key for the details given property id
		const propertyKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users.property', [propertyId]);

		//using composite key fetch the current state of property object and return
		let propertyBuffer = await ctx.stub
				.getState(propertyKey)
				.catch(err => console.log(err));

		let propertyObject = JSON.parse(propertyBuffer.toString());
		
		//Property object available in the network
		return propertyObject;
	}
}

//Export the class as module
module.exports = PropRegRegistrarContract;