package com.techelevator.dao;

import com.techelevator.model.Beer;
import com.techelevator.model.Brewery;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.rowset.SqlRowSet;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class JdbcBreweryDao implements BreweryDao {

    private JdbcTemplate jdbcTemplate;

    public JdbcBreweryDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }



    @Override
    public List<Brewery> getAllBreweries() {
        List<Brewery> breweries = new ArrayList<>();
        String sql = "SELECT * FROM breweries;";
        SqlRowSet results = jdbcTemplate.queryForRowSet(sql);
        while (results.next()) {
            breweries.add(mapRowToBrewery(results));
        }
        return breweries;
    }

    @Override
    public Brewery getBreweryById(Long id) {
        Brewery brewery = null;
        String sql = "SELECT * FROM breweries WHERE brewery_id = ?;";
        SqlRowSet resutls = jdbcTemplate.queryForRowSet(sql,id);
        if(resutls.next()) {
            brewery = mapRowToBrewery(resutls);
        }
        return brewery;
    }

    @Override
    public List<Beer> getBeersWithBreweryId(Long id) {
        List<Beer> beers = new ArrayList<>();
        String sql = "select * from beers \n" +
                "JOIN breweries on breweries.brewery_id = beers.brewery_id\n" +
                "where breweries.brewery_id = ?\n" +
                ";";
        SqlRowSet results = jdbcTemplate.queryForRowSet(sql,id);
        while(results.next()) {
            beers.add(mapRowToBeer(results));
        }
        return beers;
    }


    @Override
    public void addBrewery(Brewery brewery) {
        String sql = "INSERT INTO breweries (name,history,address,phone,email,img_url,hours,is_pet_friendly) VALUES(?,?,?,?,?,?,?,?) ;";
        jdbcTemplate.update(sql,
                brewery.getName(),
                brewery.getHistory(),
                brewery.getAddress(),
                brewery.getPhone(),
                brewery.getEmail(),
                brewery.getImgUrl(),
                brewery.getHours(),
                brewery.isPetFriendly());
    }


    @Override
    public void addBeerToBrewery(Beer beer, Long breweryId) {
        String sql1 = "INSERT INTO beers (name,brewery_id,description,img_url,abv,type) VALUES (?,?,?,?,?,?);";
        jdbcTemplate.update(sql1,
                beer.getName(),
                breweryId,
                beer.getDescription(),
                beer.getImgUrl(),
                beer.getAbv(),
                beer.getType());
    }

    @Override
    public void updateBreweryWithId(Brewery brewery, Long id) {
        String sql = "UPDATE breweries " +
                "SET name = ?," +
                "history = ?," +
                "address = ?," +
                "phone = ?," +
                "email = ?," +
                "img_url = ?," +
                "hours = ?," +
                "is_pet_friendly = ?" +
                " WHERE brewery_id = ?;";
        jdbcTemplate.update(sql,
                brewery.getName(),
                brewery.getHistory(),
                brewery.getAddress(),
                brewery.getPhone(),
                brewery.getEmail(),
                brewery.getImgUrl(),
                brewery.getHours(),
                brewery.isPetFriendly(),id);
    }

    /**
     * Delete the brewery with the matching id. As a result, and brewer associated with the role BREWER is changed to
     * USER. Additionally, all brewery beers and associated reviews are also deleted
     * @param id The id of the brewery to delete
     */
    @Override
    public void deleteBreweryWithId(Long id) {
        String updateUsers = "UPDATE users SET brewery_id = null, role = 'ROLE_USER' WHERE brewery_id = ?;";
        jdbcTemplate.update(updateUsers,id);
        String deleteReviews = "DELETE FROM reviews \n" +
                "USING beers \n" +
                "WHERE reviews.beer_id = beers.beer_id AND beers.brewery_id = ?;";
        jdbcTemplate.update(deleteReviews,id);
        String deleteBeers = "DELETE FROM beers WHERE brewery_id = ?;";
        jdbcTemplate.update(deleteBeers,id);
        String deleteBrewery = "DELETE FROM breweries WHERE brewery_id = ?;";
        jdbcTemplate.update(deleteBrewery, id);
    }

    private Brewery mapRowToBrewery(SqlRowSet results) {
        Brewery brewery = new Brewery();
        brewery.setBreweryId(results.getLong("brewery_id"));
        brewery.setName(results.getString("name"));
        brewery.setHistory(results.getString("history"));
        brewery.setAddress(results.getString("address"));
        brewery.setPhone(results.getString("phone"));
        brewery.setEmail(results.getString("email"));
        brewery.setImgUrl(results.getString("img_url"));
        brewery.setHours(results.getString("hours"));
        brewery.setPetFriendly(results.getBoolean("is_pet_friendly"));

        return brewery;
    }

    private Beer mapRowToBeer(SqlRowSet results) {
        Beer beer = new Beer();
        beer.setBeerId(results.getLong("beer_id"));
        beer.setBreweryId(results.getLong("brewery_id"));
        beer.setName(results.getString("name"));
        beer.setDescription(results.getString("description"));
        beer.setImgUrl(results.getString("img_url"));
        beer.setAbv(results.getDouble("abv"));
        beer.setType(results.getString("type"));

        return beer;
    }
}
