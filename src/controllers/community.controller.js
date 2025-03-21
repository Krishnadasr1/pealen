import prisma from "../config/prismaClient.js";

export const listCommunities = async (req, res) => {
    try {
      const communities = await prisma.community.findMany({
        include: {
          members: true 
        }
      });
      const formattedCommunities = communities.map(community => ({
        id: community.id,
        communityName:community.communityName,
        course: community.course,
        memberCount: community.members.length 
      }));
  
      return res.status(200).json({
        message: "Communities fetched successfully",
        communities: formattedCommunities
      });
  
    } catch (error) {
      console.error("Error fetching communities:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
};


export const searchCommunities = async (req, res) => {
  try {
    const { query, minMembers, maxMembers, sortBy, sortOrder, limit = 10, page = 1 } = req.query;

    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    let whereCondition = {};

    if (query) {
      whereCondition.communityName = {
        
          contains: query, 
          mode: "insensitive"
        
      };
    }

    const communities = await prisma.community.findMany({
      where: whereCondition,
      include: {
        members: true
      },
      take,
      skip,
      orderBy: sortBy ? { [sortBy]: sortOrder === "desc" ? "desc" : "asc" } : undefined
    });

    const filteredCommunities = communities
      .map(community => ({
        id: community.id,
        communityName: community.communityName,
        course: community.course,
        memberCount: community.members.length
      }))
      .filter(community => 
        (!minMembers || community.memberCount >= minMembers) &&
        (!maxMembers || community.memberCount <= maxMembers)
      );

    return res.status(200).json({
      message: "Communities fetched successfully",
      totalResults: filteredCommunities.length,
      communities: filteredCommunities
    });

  } catch (error) {
    console.error("Error searching communities:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

  