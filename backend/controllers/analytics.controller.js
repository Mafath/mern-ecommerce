import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";


//data for boxes
export const getAnalyticsData = async () => { // here we will be using aggregation pipelines
  //we will get the total number of users and total number of products and sales data and revenue data
	const totalUsers = await User.countDocuments();
	const totalProducts = await Product.countDocuments();

	const salesData = await Order.aggregate([
		{
			$group: { //we need to group data that we are gonna get
				_id: null, // it groups all documents together,
				totalSales: { $sum: 1 }, //some of the entire documents
				totalRevenue: { $sum: "$totalAmount" }, //Order model eke tynwa totalAmount field eka
			},
		},
	]);
                                                    // if undefined use these values
	const { totalSales, totalRevenue } = salesData[0] || { totalSales: 0, totalRevenue: 0 };

	return {
		users: totalUsers,
		products: totalProducts,
		totalSales,
		totalRevenue,
	};
};


//data for the chart
export const getDailySalesData = async (startDate, endDate) => {
	try {
		const dailySalesData = await Order.aggregate([
			{
				$match: {
					createdAt: {
						$gte: startDate,
						$lte: endDate,
					},
				},
			},
			{
				$group: {
					_id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
					sales: { $sum: 1 },
					revenue: { $sum: "$totalAmount" },
				},
			},
			{ $sort: { _id: 1 } },
		]);

		// example of dailySalesData(if we console.log(dailySalesData) we will get an array of objects like below)
		// [
		// 	{
		// 		_id: "2024-08-18",
		// 		sales: 12,
		// 		revenue: 1450.75
		// 	},
    // {
		// 		_id: "2024-08-19",
		// 		sales: 2,
		// 		revenue: 140.75
		// 	},  like we will have 7 different objects
		// ]

		const dateArray = getDatesInRange(startDate, endDate);
		// console.log(dateArray) // ['2024-08-18', '2024-08-19', ... ]

		return dateArray.map((date) => {
			const foundData = dailySalesData.find((item) => item._id === date);

			return {
				date,
				sales: foundData?.sales || 0,
				revenue: foundData?.revenue || 0,
			};
		});
	} catch (error) {
		throw error; //catches and handles in analytics.rote.js file's catch{} part
	}
};




function getDatesInRange(startDate, endDate) {
	const dates = [];
	let currentDate = new Date(startDate);

	while (currentDate <= endDate) {
		dates.push(currentDate.toISOString().split("T")[0]);
		currentDate.setDate(currentDate.getDate() + 1);
	}

	return dates;
}
