'use strict';

const {Contract} = require('fabric-contract-api');

/**
 * @description Smart contract for Users Organization
 */
class PropRegUsersContract extends Contract {

	/**
	 * @description Constructor method to initiate contract with unique name in the network
	 */
	constructor() {
		// Name of the smart contract
		super('org.property-registration-network.regnet.users');
	}

	/**
	 * @description instantiate the smart contract
	 * @param {*} ctx The transaction context object
	 */
	async instantiate(ctx) {
		console.log('Smart Contract for User Instantiated');
	}

	/**
	 * @description Request from user to register on the network
	 * @param {*} ctx The transaction context object
	 * @param {*} name Name of the user
	 * @param {*} email Email ID of the user
	 * @param {*} phoneNumber Phone number of the user
	 * @param {*} aadharId Aadhar Id of the user
	 * @returns Returns user request object
	 */
	async requestNewUser(ctx, name, email, phoneNumber, aadharId) {

		// Create a new composite key for the new student account
		const userKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users', [name,aadharId]);

		// Create a student object to be stored in blockchain
		let newUserObject = {
			name: name,
			email: email,
			phoneNumber: phoneNumber,
			aadharId: aadharId,
			userId: ctx.clientIdentity.getID(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		// Convert the JSON object to a buffer and send it to blockchain for storage
		let dataBuffer = Buffer.from(JSON.stringify(newUserObject));
		await ctx.stub.putState(userKey, dataBuffer);

		// Return value of new account created to user
		return newUserObject;
	}

	/**
	 * @description Method to recharge the account with the upgradCoins.  Here the coin is retrieved from the bankTransactionId sent in the arguement
	 * @param {*} ctx  The transaction context object
	 * @param {*} name Name of the user
	 * @param {*} aadharId  Aadhar Id of the user
	 * @param {*} bankTransactionId mocked bank transaction id for this project
	 * @returns Updated user detail in the network
	 */
	async rechargeAccount(ctx, name, aadharId, bankTransactionId){

		// Bank Transaction ID	with Number of upgradCoins
		let bankTxIdArray = [{'id':'upg500', 'value':500}, {'id':'upg1000', 'value':1000}, {'id':'upg1500', 'value':1500}];
		
		//Fetch upgradCoins based on the bank transaction id
		let txnDetails ;
		for (var i=0; i < bankTxIdArray.length; i++) {
			if (bankTxIdArray[i].id === bankTransactionId) {
				txnDetails = bankTxIdArray[i];
			}
    	}

		//create composite key for the users
		const userKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users', [name, aadharId]);

		//using composite key fetch the current state of user object
		let userBuffer = await ctx.stub
				.getState(userKey)
				.catch(err => console.log(err));


		//validate bankTransactionId with the expected value and if the user found in the network
		if(txnDetails && userBuffer){

			//Update user object with new properties
			let userObject = JSON.parse(userBuffer.toString());
			if(userObject.status === 'Approved'){
				userObject.upgradCoins = userObject.upgradCoins + txnDetails.value;
				userObject.updatedAt = new Date();
	
				// Convert the JSON object to a buffer and send it to blockchain for storage
				let dataBuffer = Buffer.from(JSON.stringify(userObject));
				await ctx.stub.putState(userKey, dataBuffer);
	
				// Return value of updated  user object
				return userObject;
	
			}
			else{ //Decline the transaction if user is not registered in the network
				throw new Error('User should be registered in the network to recharge account');
			}
		}
		else{ //Decline the transaction if bank transaction id is invalid
			throw new Error('Invalid Transaction ID: ' + bankTransactionId );
		}
	}

	/**
	 * @description View user details in the network
	 * @param {*} ctx The transaction context object
	 * @param {*} name Name of the user
	 * @param {*} aadharId Aadhar Id of the user
	 * @returns User object in the network if found, otherwise throws error
	 */
	async viewUser(ctx, name, aadharId){
		//create composite key for the user
		const userKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users', [name, aadharId]);


		//using composite key fetch the current state of user object and return
		let userBuffer = await ctx.stub
				.getState(userKey)
				.catch(err => console.log(err));
		
		if(userBuffer){
			//user object in the network
			let userObject = JSON.parse(userBuffer.toString());
			return userObject;

		}
		else{
			throw new Error('User is not available in the network, please cross check the detail');
		}
	}

	/**
	 * @description Method to request to user's property to be registered in the network.  
	 * @param {*} ctx The transaction context object
	 * @param {*} propertyId Unique property id of the property
	 * @param {*} price Price of the property
	 * @param {*} name Name of the user (owner) who want to register their property in the network
	 * @param {*} aadharId Aadhar id of the user (owner) who want to register their property in the network
	 * @returns Propety request object
	 */
	async propertyRegistrationRequest(ctx, propertyId, price, name, aadharId){

		//create composite key for the user detail given
		const userKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users', [name, aadharId]);

		//fetch the user details from the ledger using composite key fetch the current state of user object and return
		let userBuffer = await ctx.stub
				.getState(userKey)
				.catch(err => console.log(err));

		let userObject = JSON.parse(userBuffer.toString());

		//if user is registered in the network, then proceed, otherwise, decline the transaction
		if(userObject.status === 'Approved'){
			//user is valid, then register the property request in the ledger.
			//Use name, aadharId, and propertyId to create new composite key for property
			const propertyKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users.property', [propertyId]);

			// Create a property object to be stored in blockchain
			let propertyObject = {
				propertyId: propertyId,
				owner: name+"-"+aadharId,
				price: price,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			// Convert the JSON object to a buffer and send it to blockchain for storage
			let propertyDataBuffer = Buffer.from(JSON.stringify(propertyObject));
			await ctx.stub.putState(propertyKey, propertyDataBuffer);

			// Return value of new property request requested by the user
			return propertyObject;
		}
		else{
			throw new Error('User is not registered in the network');
		}
	}

	/**
	 * @description View property details
	 * @param {*} ctx The transaction context object
	 * @param {*} propertyId Unique property id of the property
	 */
	async viewProperty(ctx, propertyId){

		//create composite key for the details given property id
		const propertyKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users.property', [propertyId]);

		//using composite key fetch the current state of property object and return
		let propertyBuffer = await ctx.stub
				.getState(propertyKey)
				.catch(err => console.log(err));
		if(propertyBuffer){
			let propertyObject = JSON.parse(propertyBuffer.toString());
			return propertyObject;
		}
		else{
			throw new Error('Property is not found in the network');
		}
	}

	/**
	 * @description Method to update property status
	 * @param {*} ctx The transaction context object
	 * @param {*} propertyId Unique property id of the property
	 * @param {*} name Name of the user who owns the property in the network
	 * @param {*} aadharId Aadhar id of the user who owns the property in the network
	 * @param {*} propertyStatus Property status to be updated 
	 */
	async updateProperty(ctx, propertyId, name, aadharId, propertyStatus){

		//create composite key for the property given.
		const propertyKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users.property', [propertyId]);

		//cretae composite key for the user detail given
		const userKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users', [name, aadharId]);

		//fetch user details from the ledger.
		let userBuffer = await ctx.stub
				.getState(userKey)
				.catch(err => console.log(err));

		let userObject = JSON.parse(userBuffer.toString());

		//if the user is registered, then proceed.
		if(userObject.status === 'Approved'){

			//fetch property details from the ledger.
			//using composite key fetch the current state of property object and return
			let propertyBuffer = await ctx.stub
					.getState(propertyKey)
					.catch(err => console.log(err));

			let propertyObject = JSON.parse(propertyBuffer.toString());

			//check whether the owner of the property and the request initiator are same, then proceed.
			if(propertyObject.owner === (name + "-" + aadharId)){
				
				propertyObject.status = propertyStatus;

				//update property details in ledger.
				let propertyDataBuffer = Buffer.from(JSON.stringify(propertyObject));
				await ctx.stub.putState(propertyKey, propertyDataBuffer);
				
				// Return value of new account created to user
				return propertyObject;

			}
			else{
				//if request initiated by different user, then reject the transaction as only owner can upate status of the property.
				throw new Error("Not authorized to update property ");
				return false;
			}
		}
		else{
			throw new Error("Not authorized to update property ");
			return false;
		}
	}

	/**
	 * @// TODO: Check if buyer is same as seller then reject the request
	 */
	/**
	 * @description Method to purchase property request by registered buyer in the network.  
	 * @description Buyer will be allowed to purchase only if his/her account balance is > property price
	 * @description Buyer will be allowed to purchase only if the property status is 'onSale'
	 * @description If all the conditions are met, then updates buyer as owner of the property and returns the details of Property, Buyer and Seller
	 * @param {*} ctx The transaction context object
	 * @param {*} propertyId Unique property id which buyer wants to purchase
	 * @param {*} buyerName name of the buyer who is registered in the network 
	 * @param {*} buyerAadharId Aadhar id of the buyer
	 */
	async purchaseProperty(ctx, propertyId, buyerName, buyerAadharId){

		//create composite key for property and fetch property details. Proceed further, if the property status is 'onsale'
		//create composite key for the buyer and check whether buyer is already registered in the network.
		const propertyKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users.property', [propertyId]);
		const buyerUserKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users', [buyerName, buyerAadharId]);

		//fetch user details from the ledger.
		let buyerUserBuffer = await ctx.stub
				.getState(buyerUserKey)
				.catch(err => console.log(err));

		let buyerObject = JSON.parse(buyerUserBuffer.toString());

		//if the user is registered, then proceed.
		if(buyerObject.status === 'Approved'){

			//fetch property details from the ledger.
			//using composite key fetch the current state of property object and return
			let propertyBuffer = await ctx.stub
					.getState(propertyKey)
					.catch(err => console.log(err));

			let propertyObject = JSON.parse(propertyBuffer.toString());

			//If the request made for current owner, it should be declined
			if(propertyObject.owner === (buyerName+"-"+buyerAadharId)){
				throw new Error("Your request is invalid as you are already owner of this property");
			}

			//If the property status is 'onSale' then prceed.
			if(propertyObject.status === 'onSale'){
				//then check the buyer has sufficient balance in his/her account

				if(buyerObject.upgradCoins > propertyObject.price){
					let ownerDetail = propertyObject.owner.split('-');
					console.log('OWNER DETAILS', ownerDetail);
					//get owner details from ledger.
					const ownerUserKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users', [ownerDetail[0], ownerDetail[1]]);

					//fetch user details from the ledger.
					let ownerUserBuffer = await ctx.stub
							.getState(ownerUserKey)
							.catch(err => console.log(err));

					let ownerObject = JSON.parse(ownerUserBuffer.toString());

					//deduct property price from buyer account
					buyerObject.upgradCoins = parseInt(buyerObject.upgradCoins) - parseInt(propertyObject.price);
					buyerObject.updatedAt = new Date();

					//add property price to owner
					ownerObject.upgradCoins = parseInt(ownerObject.upgradCoins) + parseInt(propertyObject.price);
					ownerObject.updatedAt = new Date();

					//updated the ownwer of the property as buyer id, status as registered
					propertyObject.owner = buyerName+ "-" + buyerAadharId;
					propertyObject.status='registered';
					propertyObject.updatedAt = new Date();

					//update property details in ledger
					let updateProperty = Buffer.from(JSON.stringify(propertyObject));
					await ctx.stub.putState(propertyKey, updateProperty);

					//update buyer details in ledger.
					let updateBuyer = Buffer.from(JSON.stringify(buyerObject));
					await ctx.stub.putState(buyerUserKey, updateBuyer);

					//update owner details in ledger.
					let updateOwner = Buffer.from(JSON.stringify(ownerObject));
					await ctx.stub.putState(ownerUserKey, updateOwner);

					return (JSON.stringify(propertyObject) + JSON.stringify(buyerObject) + JSON.stringify(ownerObject));

				}
				else{
					throw new Error("No enough balance, please recharge your account");
				}
			}
			else{
				throw new Error("Property is not for sale");
			}
		}
		else{
			throw new Error("User is not registered in the work");
		}
	}
}

module.exports = PropRegUsersContract;
